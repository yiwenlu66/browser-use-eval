import Eko from "@eko-ai/eko";
import { tools as nodejsTools } from "@eko-ai/eko/nodejs";
import { WorkflowParser, ExecutionLogger } from "@eko-ai/eko";
import { readFile, writeFile, mkdir, readdir } from "fs/promises";
import { join } from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Required environment variables
const requiredEnvVars = [
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_BASE_URL',
  'TASK_ID',
  'TASK_PROMPT'
] as const;

// Validate environment variables are present
function validateEnv() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Configuration from environment
const config = {
  resultsDir: process.env.RESULTS_DIR || './results',
  taskId: process.env.TASK_ID!,
  taskPrompt: process.env.TASK_PROMPT!,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
  anthropicBaseUrl: process.env.ANTHROPIC_BASE_URL!,
  debug: process.env.DEBUG === 'true',
  headless: process.env.HEADLESS !== 'false'  // Default to true unless explicitly set to false
};

// Interface for task results
interface TaskResult {
  task_id: string;
  start_time: string;
  end_time: string;
  task_prompt: string;
  result?: any;
  error?: string;
  screenshots: string[];
}

async function ensureDirectories() {
  const dirs = [
    config.resultsDir,
    join(config.resultsDir, 'screenshots'),
    join(config.resultsDir, 'logs')
  ];

  for (const dir of dirs) {
    try {
      await mkdir(dir, { recursive: true });
    } catch (err) {
      if ((err as any).code !== 'EEXIST') {
        console.error(`Failed to create directory ${dir}:`, err);
        throw err;
      }
    }
  }
}

async function collectScreenshots(screenshotsDir: string): Promise<string[]> {
  try {
    const files = await readdir(screenshotsDir);
    return files.filter(file => file.endsWith('.jpeg')).sort();
  } catch (err) {
    console.error('Error collecting screenshots:', err);
    return [];
  }
}

async function saveWorkflowResults(result: any, startTime: Date) {
  try {
    const screenshotsDir = join(config.resultsDir, 'screenshots');
    const screenshots = await collectScreenshots(screenshotsDir);

    const taskResult: TaskResult = {
      task_id: config.taskId,
      start_time: startTime.toISOString(),
      end_time: new Date().toISOString(),
      task_prompt: config.taskPrompt,
      result: result,
      screenshots
    };

    await writeFile(
      join(config.resultsDir, 'task_result.json'),
      JSON.stringify(taskResult, null, 2)
    );

    console.log(JSON.stringify({ success: true, result: taskResult }));
  } catch (err) {
    console.error('Failed to save results:', err);
    throw err;
  }
}

async function main() {
  const startTime = new Date();

  try {
    // Validate environment and create directories
    validateEnv();
    await ensureDirectories();

    if (config.debug) {
      console.log('Config:', {
        ...config,
        anthropicApiKey: '***' // Hide sensitive data
      });
    }

    // Initialize Eko
    const eko = new Eko({
      llm: "claude",
      apiKey: config.anthropicApiKey,
      options: {
        baseURL: config.anthropicBaseUrl
      }
    });

    // Configure browser options
    const browserOptions = {
      headless: config.headless,
      args: ['--no-sandbox'],  // Required for Docker
      defaultViewport: { width: 1280, height: 720 }
    };

    if (config.debug) {
      console.log(`Running browser in ${config.headless ? 'headless' : 'headed'} mode`);
    }

    // Register browser tool with options
    eko.registerTool(new nodejsTools.BrowserUse({ browserOptions }));

    // Set up logger
    const logger = new ExecutionLogger({
      logLevel: config.debug ? "debug" : "info",
      includeTimestamp: true,
      debugImagePath: join(config.resultsDir, 'screenshots')
    });

    // Generate workflow
    console.log(`Generating workflow for task: ${config.taskId}`);
    const workflow = await eko.generate(config.taskPrompt);
    workflow.setLogger(logger);

    // Save workflow definition
    await writeFile(
      join(config.resultsDir, 'workflow.json'),
      WorkflowParser.serialize(workflow)
    );

    // Execute workflow
    console.log('Executing workflow...');
    const result = await eko.execute(workflow);

    // Save results and exit
    await saveWorkflowResults(result, startTime);
    return 0;

  } catch (error) {
    console.error('Task execution failed:', error);

    // Even on error, try to collect screenshots and save results
    const screenshotsDir = join(config.resultsDir, 'screenshots');
    const screenshots = await collectScreenshots(screenshotsDir);

    const taskResult: TaskResult = {
      task_id: config.taskId,
      start_time: startTime.toISOString(),
      end_time: new Date().toISOString(),
      task_prompt: config.taskPrompt,
      error: error instanceof Error ? error.message : String(error),
      screenshots
    };

    try {
      await writeFile(
        join(config.resultsDir, 'task_result.json'),
        JSON.stringify(taskResult, null, 2)
      );
    } catch (err) {
      console.error('Failed to save error result:', err);
    }

    console.log(JSON.stringify({ success: false, error: taskResult }));
    return 1;
  }
}

// Run main
if (require.main === module) {
  main()
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}
