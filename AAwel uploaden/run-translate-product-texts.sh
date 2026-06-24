#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

node translate-product-texts.mjs \
  --source-dir="../mfw_teksten" \
  --overwrite \
  --out-dir="./generated-mfw-teksten"
