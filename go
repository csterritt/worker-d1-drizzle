#!/bin/bash
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.

set -euo pipefail
if [[ "x${1-}" = "xg" ]] ; then
  npm run dev-gated-sign-up
elif [ "x${1-}" = "xn" ]; then
  npm run dev-no-sign-up
elif [ "x${1-}" = "xo" ]; then
  npm run dev-open-sign-up
elif [ "x${1-}" = "xi" ]; then
  npm run dev-interest-sign-up
elif [ "x${1-}" = "xb" ]; then
  npm run dev-both-sign-up
else
  echo "Usage: go <b|g|i|n|o>"
  exit 1
fi
