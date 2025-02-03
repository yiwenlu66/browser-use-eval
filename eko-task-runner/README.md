## Setup

1. Install Eko locally. In eko:
    - Checkout `develop` branch
    - `yarn install && yarn run build && yarn link -g`

2. Set up benchmarking project:
    - `yarn init`
    - `yarn add tsx`
    - `yarn link @eko-ai/eko`

3. Setup up playwright for automated browser:
    - `yarn add playwright`
    - `npx playwright install` (will download browser binaries)

4. Set up environment variables for the task in `.env`, e.g.:

    ```bash
    # API Configuration
    ANTHROPIC_API_KEY=your-key
    ANTHROPIC_BASE_URL=your-url

    # Task Configuration
    TASK_ID=test-task-1
    TASK_PROMPT=Search an Xbox Wireless controller with green color and rated above 4 stars on https://www.amazon.com/

    # Runtime Configuration
    RESULTS_DIR=./results
    DEBUG=false  # Set to 'false' in production

    HEADLESS=true
    ```

5. Run benchmarking script:
   - `yarn run tsx main.ts &2>1 | tee log.txt`
   - Can customize task prompt and screenshot path in `main.ts`
   - Screenshots will be saved, and execution logs will be printed in `log.txt`

## Containerization and running a task

1. Run `./build.sh` to build the Docker image for Eko task runner
2. Edit `run-task.sh` to fill in API key and base URL
3. Now we can quickly run a task in a dedicated container with a shell script: `./run-task.sh "test-task-1" "Search an Xbox Wireless controller with green color and rated above 4 stars on https://www.amazon.com/"`. A stamped subdirectory will be automatically created in the `results` directory, containing output log, generated workflow, task execution result and screenshots.

## Evaluation

1. Export `OPENAI_API_KEY` environment variable
2. Run `python eval_single_task.py results/xxx` to evaluate the execution result of a single task
3. Result will be saved to `results/xxx/eval_result.json`

## Estimation of computation time

- 3 minutes per task
- 650 tasks from WebVoyager
- On a 32-core machine: 3 minutes * 650 tasks / 32 cores = 1 hour per evaluation (subject to LLM API rate limits)

## Known issues

- Need to set up user cookie for the automated browser, in order to avoid captcha
- May need web proxies (different IP for parallel requests) to avoid rate limits
