#!/bin/bash
# CI/CD Variables → .env file generation (Static)
# Usage: ./scripts/build-env-from-cicd.sh [output-file]
set -e

OUTPUT_FILE="${1:-.env}"

# Start with defaults
cat > "$OUTPUT_FILE" << EOF
PORT=80
EOF

# If ENV_PRODUCTION variable exists, merge it (user-provided env vars)
if [ -n "$ENV_PRODUCTION" ]; then
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    if [[ "$line" == \#* ]]; then
      echo "$line" >> "$OUTPUT_FILE"
      continue
    fi
    key="${line%%=*}"
    if [ -n "$key" ]; then
      sed -i "/^${key}=/d" "$OUTPUT_FILE"
      echo "$line" >> "$OUTPUT_FILE"
    fi
  done <<< "$ENV_PRODUCTION"
fi

echo "[build-env] Generated $OUTPUT_FILE with $(wc -l < "$OUTPUT_FILE") lines"
