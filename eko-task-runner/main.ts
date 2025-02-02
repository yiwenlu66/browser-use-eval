import Eko from "@eko-ai/eko";
import { tools as nodejsTools } from "@eko-ai/eko/nodejs";
import { WorkflowParser, ExecutionLogger } from "@eko-ai/eko";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

interface TaskResult {
  taskId: string;
  steps: {
    action: string;
    screenshot?: string;
    timestamp: string;
  }[];
  result?: string;
  error?: string;
}

async function saveScreenshot(
  taskId: string,
  stepIndex: number,
  screenshot: string
): Promise<void> {
  const resultsDir = process.env.RESULTS_DIR || "results";
  const screenshotPath = join(resultsDir, "screenshots", `step_${stepIndex}.png`);

  // Convert base64 to buffer and save
  const data = Buffer.from(screenshot.split(",")[1], "base64");
  await writeFile(screenshotPath, data);
}

async function main() {
  // Get task parameters from environment
  const taskId = process.env.TASK_ID;
  const taskPrompt = process.env.TASK_PROMPT;
  const resultsDir = process.env.RESULTS_DIR || "results";

  if (!taskId || !taskPrompt) {
    throw new Error("Missing required environment variables: TASK_ID, TASK_PROMPT");
  }

  const result: TaskResult = {
    taskId,
    steps: [],
  };

  const eko = new Eko({
    llm: "claude",
    apiKey: process.env.ANTHROPIC_API_KEY,
    options: {
      baseURL: process.env.ANTHROPIC_BASE_URL
    }
  });

  try {
    // Register browser tool
    eko.registerTool(new nodejsTools.BrowserUse());

    // Generate workflow
    console.log(`[${new Date().toISOString()}] Generating workflow...`);
    const workflow = await eko.generate(taskPrompt);
    console.log(`[${new Date().toISOString()}] Workflow generated`);

    // Save workflow DSL
    const dsl = WorkflowParser.serialize(workflow);
    await writeFile(join(resultsDir, "workflow.json"), dsl);

    // Set up logging with screenshots
    const logger = new ExecutionLogger({
      logLevel: "info",
      includeTimestamp: true,
      onScreenshot: async (screenshot: string, metadata: any) => {
        const stepIndex = result.steps.length;
        await saveScreenshot(taskId, stepIndex, screenshot);
        result.steps.push({
          action: metadata.action || "unknown",
          screenshot: `step_${stepIndex}.png`,
          timestamp: new Date().toISOString(),
        });
      },
    });
    workflow.setLogger(logger);

    // Execute workflow
    console.log(`[${new Date().toISOString()}] Executing workflow...`);
    const executionResult = await eko.execute(workflow);
    console.log(`[${new Date().toISOString()}] Workflow executed`);

    // Save result
    result.result = executionResult.toString();
    await writeFile(
      join(resultsDir, "execution_result.json"),
      JSON.stringify(result, null, 2)
    );

    // Output final result for Python process
    console.log(JSON.stringify(result));
    return 0;

  } catch (error) {
    console.error("Error:", error);
    result.error = error.toString();

    // Still try to save what we have
    await writeFile(
      join(resultsDir, "execution_result.json"),
      JSON.stringify(result, null, 2)
    );

    // Output error result for Python process
    console.log(JSON.stringify(result));
    return 1;
  }
}

// Run main with error handling
main()
  .then((exitCode) => process.exit(exitCode))
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
