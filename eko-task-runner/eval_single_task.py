import argparse
import asyncio
import json
import logging
from base64 import b64encode
import os
from pathlib import Path
from openai import OpenAI
from typing import Literal

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

EvalResult = Literal["success", "failed", "unknown"]

SYSTEM_PROMPT = """As an evaluator, you will be presented with three primary components to assist you in your role:

1. Web Task Instruction: This is a clear and specific directive provided in natural language, detailing the online activity to be carried out. These requirements may include conducting searches, verifying information, comparing prices, checking availability, or any other action relevant to the specified web service (such as Amazon, Apple, ArXiv, BBC News, Booking etc).

2. Result Screenshots: This is a visual representation of the screen showing the result or intermediate state of performing a web task. It serves as visual proof of the actions taken in response to the instruction, and may not represent everything the agent sees.

3. Result Response: This is a textual response obtained after the execution of the web task. It serves as textual result in response to the instruction.

-- You DO NOT NEED to interact with web pages or perform actions such as booking flights or conducting searches on websites.
-- You SHOULD NOT make assumptions based on information not presented in the screenshot when comparing it to the instructions. If you cannot find any information in the screenshot that matches the instruction, you can believe the information in the response.
-- Your primary responsibility is to conduct a thorough assessment of the web task instruction against the outcome depicted in the screenshot and in the response, evaluating whether the actions taken align with the given instructions.
-- NOTE that the instruction may involve more than one task, for example, locating the garage and summarizing the review. Failing to complete either task, such as not providing a summary, should be considered unsuccessful.
-- NOTE that the screenshot is authentic, but the response provided by LLM is generated at the end of web browsing, and there may be discrepancies between the text and the screenshots.
-- Note the difference: 1) Result response may contradict the screenshot, then the content of the screenshot prevails, 2) The content in the Result response is not mentioned on the screenshot, choose to believe the content.
-- If you are not sure whether you should believe the content in the response, you should choose unknown.

You should elaborate on how you arrived at your final evaluation and then provide a definitive verdict on whether the task has been successfully accomplished, either as 'SUCCESS', 'NOT SUCCESS', or 'UNKNOWN'."""

USER_PROMPT = """TASK: <task>
Result Response: <answer>
<num> screenshot at the end: """

def evaluate_task(task_dir: Path) -> None:
    """Evaluate a single task result directory"""
    try:
        # Load task result
        with open(task_dir / "task_result.json") as f:
            task_result = json.load(f)

        # Prepare screenshots
        screenshots = []
        screenshots_dir = task_dir / "screenshots"
        for screenshot_file in sorted(screenshots_dir.glob("*.jpeg")):
            with open(screenshot_file, "rb") as f:
                screenshot_data = f.read()
                screenshots.append(b64encode(screenshot_data).decode())

        logger.info(f"Found {len(screenshots)} screenshots")

        # Format prompt
        user_prompt_tmp = USER_PROMPT.replace("<task>", task_result["task_prompt"])
        user_prompt_tmp = user_prompt_tmp.replace("<answer>", str(task_result["result"]))
        user_prompt_tmp = user_prompt_tmp.replace("<num>", str(len(screenshots)))

        # Initialize OpenAI client
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        # Get evaluation
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": user_prompt_tmp
                        },
                        *[{
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{screenshot}"
                            }
                        } for screenshot in screenshots],
                        {
                            "type": "text",
                            "text": "Your verdict:\n"
                        }
                    ]
                }
            ],
            max_tokens=1000
        )

        gpt_4v_res = response.choices[0].message.content

        # Parse result
        if "NOT SUCCESS" in gpt_4v_res:
            eval_result = "failed"
        elif "SUCCESS" in gpt_4v_res:
            eval_result = "success"
        else:
            eval_result = "unknown"

        # Save evaluation
        eval_data = {
            "eval_result": eval_result,
            "gpt_4v_response": gpt_4v_res
        }

        with open(task_dir / "eval_result.json", "w") as f:
            json.dump(eval_data, f, indent=2)

        logger.info(f"Evaluation result: {eval_result}")
        logger.info("Full evaluation response saved to eval_result.json")
    except Exception as e:
        logger.error(f"Error evaluating task: {e}")
        raise

def main():
    parser = argparse.ArgumentParser(description="Evaluate single Eko task result")
    parser.add_argument(
        "task_dir",
        type=str,
        help="Directory containing task result"
    )
    args = parser.parse_args()

    task_dir = Path(args.task_dir)
    if not task_dir.exists():
        raise ValueError(f"Task directory {task_dir} does not exist")

    evaluate_task(task_dir)

if __name__ == "__main__":
    main()
