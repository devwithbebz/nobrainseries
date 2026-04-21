python3 << 'EOF'
import json
path = "/root/.unsloth/studio/exports/gemma-4-E4B-it-uncensored-gguf/model/tokenizer_config.json"
with open(path) as f:
    config = json.load(f)
if isinstance(config.get("extra_special_tokens"), list):
    config["extra_special_tokens"] = {}
with open(path, "w") as f:
    json.dump(config, f, ensure_ascii=False, indent=2)
print("Fixed!")
EOF