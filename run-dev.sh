#!/bin/bash
set -euo pipefail

source .env.sh

concurrently -c auto \
  -n tw-build,wrangler \
  "npx @tailwindcss/cli -i ./src/style.css -o public/style-XXXXXX.css --watch" \
   "wrangler dev"
