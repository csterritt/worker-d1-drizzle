#!/bin/bash
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.

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
