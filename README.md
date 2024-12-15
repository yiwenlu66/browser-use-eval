<div align="center">
<h1> WebVoyager evaluation for Browser Use
</div>

<div align="center">
This repository is a fork of <a href="https://github.com/MinorJerry/WebVoyager">original repo</a> </div>

<div align="center">
<img src="./assets/icon.png" width="45px"> <img src="https://browser-use.com/logo.png" width="45px">
</div>

# Evaluation runs

The file structure is the same as the original repo.
The only difference is that the `run_browser_use.py` is modified to add the browser use evaluation, we also changed the prompts to be suitable for the browser use evaluation (VERY minimal changes - evaluate multiple images, not just one) and switched to langchain.

We also have a list of impossible tasks that are not possible anymore (completely outdated, can't be fixed with dates).

We changed some tasks that included dates to be more in the future instead of the past since the data is outdated which would make the task impossible (e.g. "Please find me a hotel on 2023-12-01 on booking.com", which is impossible since you can't search for a hotel in the past).

We ran the evaluation on 16gb of RAM with 15 concurrent tasks.

`requirements.txt` is missing `browser-use` on purpose since we install it by building the package locally.

## Manual correction of evaluations

The eval model is not good. That's why we added another success criteria - `unknown` if the eval model is not sure.

Most of the tasks are indeed correct, but some tasks had wrong assesment, and `unknown` either went into `success` or `failed`.

We manually reviewed the evaluations for the tasks that are either "unknown" or "failed" and corrected them. This is due to the fact that the default WebVoyager evaluator is not good.

## Costs

The whole cost of running the dataset once is around 250 USD for gpt4o.

## Interesting findings

- WebVoyager is a terrible dataset.
  - a lot of tasks are straight up impossible (outdated usually)
  - many prompts are VERY ambiguous and can be interpreted in many ways - which confuses the model (both agent and eval model)
- why do we have to rely on third party websites? That is not scalable.
- the dataset does not test for actual understanding of website, mostly of planning and reasoning - NOT what you want from web agent evaluations on COMPLEX sites

# Todos

- make manually labeled items more transparent
- add proxies
- test all kinds of models and different setups (Claude, GPT-4o, Llama 3, etc.)
- test different setups (single vs multiple images, single vs multiple tasks, etc.)
