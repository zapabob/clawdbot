from huggingface_hub import hf_hub_download
import os

repo_id = "Qwen/Qwen2.5-7B-Instruct"
local_dir = r"H:\from_D\SO8T_models\Qwen2.5-7B-Instruct"
files = [
    "model-00001-of-00004.safetensors",
    "model-00002-of-00004.safetensors",
    "model-00003-of-00004.safetensors"
]

for filename in files:
    print(f"Downloading {filename}...")
    hf_hub_download(
        repo_id=repo_id,
        filename=filename,
        local_dir=local_dir,
        local_dir_use_symlinks=False
    )
    print(f"Finished {filename}")
