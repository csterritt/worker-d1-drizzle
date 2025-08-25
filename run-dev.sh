#!/bin/bash
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.

set -euo pipefail

source .env.sh

if [[ "x${1-}" = "xgated-sign-up" ]] ; then
  echo "====> Gated mode"
  export SIGN_UP_MODE='GATED_SIGN_UP'
elif [ "x${1-}" = "xno-sign-up" ]; then
  echo "====> No sign-up"
  export SIGN_UP_MODE='NO_SIGN_UP'
elif [ "x${1-}" = "xinterest-sign-up" ]; then
  echo "====> Interest sign-up"
  export SIGN_UP_MODE='INTEREST_SIGN_UP'
elif [ "x${1-}" = "xopen-sign-up" ]; then
  echo "====> Open sign-up"
  export SIGN_UP_MODE='OPEN_SIGN_UP'
else
  echo "No argument given for the sign up mode"
  exit 1
fi

styleFile="public/style-XXXXXX.css"
if [ -e public/style-[0-9]*.css ]; then
  styleFile=$(/bin/ls public/style-[0-9]*.css)
fi

echo "# DERIVED FILE DO NOT EDIT - edit .dev.vars.all instead" > .dev.vars
cat .dev.vars.all >> .dev.vars
echo "SIGN_UP_MODE=${SIGN_UP_MODE}" >> .dev.vars

concurrently -c auto \
  -n tw-build,mailpit,wrangler \
  "npx @tailwindcss/cli -i ./src/style.css -o ${styleFile} --watch" \
  "mailpit" \
  "wrangler dev"
