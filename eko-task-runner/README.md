## Setup

1. Install Eko locally. In eko:
    - Checkout `develop` branch
    - `yarn install && yarn run build && yarn link -g`

2. Setup benchmarking project:
    - `yarn init`
    - `yarn add tsx`
    - `yarn link @eko-ai/eko`

3. Setup up playwright for automated browser:
    - `yarn add playwright`
    - `npx playwright install` (will download browser binaries)

4. Run benchmarking script:
   - `yarn run tsx main.ts &2>1 | tee log.txt`
   - Can customize task prompt and screenshot path in `main.ts`
   - Screenshots will be saved, and execution logs will be printed in `log.txt`

## Estimation of computation time

- 3 minutes per task
- 650 tasks from WebVoyager
- On a 32-core machine: 3 minutes * 650 tasks / 32 cores = 1 hour per evaluation (subject to LLM API rate limits)

## Known issues

- Need to set up user cookie for the automated browser, in order to avoid captcha
- May need web proxies (different IP for parallel requests) to avoid rate limits
