import json
import os

folder = "results/examples-browser-use"

success_count = 0
total_count = 1
print(f"Total tasks: {len(os.listdir(folder))}")
for subfolder in os.listdir(folder):
    for file in os.listdir(os.path.join(folder, subfolder)):
        if file.endswith("task_result.json"):
            print(f"Processing {subfolder}")
            with open(os.path.join(folder, subfolder, file), "r") as f:
                data = json.load(f)
            if data["success"] == "success":
                success_count += 1
            total_count += 1

print(f"Success rate: {success_count / total_count:.2f}={success_count}/{total_count}")
