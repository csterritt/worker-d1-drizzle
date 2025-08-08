#!/bin/bash
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.

set -euo pipefail

function yes_or_no {
    while true; do
        read -p "$* [YES/n]: " yn
        case ${yn} in
            YES) return 0  ;;
            [Nn]*) echo "Cancelled" ; return  1 ;;
            *) ;;
        esac
    done
}


local="TRUE"
if [[ "x${1-}" != "x" ]] ; then
  local="FALSE"
fi

/bin/rm -f schema.sql
for i in `/bin/ls drizzle/*.sql` ; do
  perl -ne 'if (/^(.*)CREATE TABLE (.*)$/) {print "${1}CREATE TABLE IF NOT EXISTS $2\n"} elsif (/^(.*)CREATE UNIQUE INDEX (.*)$/) {print "${1}CREATE UNIQUE INDEX IF NOT EXISTS $2\n"} elsif (/^(.*)CREATE INDEX (.*)$/) {print "${1}CREATE INDEX IF NOT EXISTS $2\n"} else {print $_}' $i >> schema.sql
done

if [[ "${local}" = "TRUE" ]] ; then
  wrangler d1 execute worker-d1-drizzle --file=./schema.sql
else
  yes_or_no "Really update the remote database?"
  if [[ -n $? ]] ; then
    echo "Updating remote database in 5 seconds..."
    sleep 5
    echo "Updating remote database"
    wrangler d1 execute worker-d1-drizzle --file=./schema-prod.sql --remote
  fi
fi
