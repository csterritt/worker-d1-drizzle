#!/bin/bash
set -euo pipefail

source .env.sh

styleFile="public/style-XXXXXX.css"
if [ -e public/style-[0-9]*.css ]; then
  styleFile=$(/bin/ls public/style-[0-9]*.css)
fi

concurrently -c auto \
  -n tw-build,wrangler \
  "npx @tailwindcss/cli -i ./src/style.css -o ${styleFile} --watch" \
   "wrangler dev"
