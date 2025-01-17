import json
import os


def get_score(folder):
    success_count = 0
    total_count = 1
    print(f"Processing {folder}")
    print(f"Total tasks: {len(os.listdir(folder))}")
    for subfolder in os.listdir(folder):
        # if not folder, skip
        if not os.path.isdir(os.path.join(folder, subfolder)):
            continue
        for file in os.listdir(os.path.join(folder, subfolder)):
            if file.endswith("task_result.json"):
                with open(os.path.join(folder, subfolder, file), "r") as f:
                    data = json.load(f)
                if data["success"] == "success":
                    success_count += 1
                total_count += 1

    print(
        f"Success rate : {success_count / total_count:.2f}={success_count}/{total_count}"
    )
    print()


main_folder = "results"
print("Success rate for each folder:")
for folder in os.listdir(main_folder):
    if not os.path.isdir(os.path.join(main_folder, folder)):
        continue
    get_score(os.path.join(main_folder, folder))
