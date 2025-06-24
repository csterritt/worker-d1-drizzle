#!/bin/bash
set -Eeuo

curl -s 'http://localhost:3000' > /dev/null || ( echo 'No local server running' ; exit 1 )
./clean-for-production.rb || exit 1
echo clean
git reset --hard HEAD
msg=$(./update-version.rb)
git commit -a -m "$msg"

git checkout main
git merge --no-commit -s ort -Xtheirs dev || echo "Merge conflicts found, evidently."
./clean-for-production.rb ignore || exit 1
sleep 1
curl -s 'http://localhost:3000' > src/index.html || exit 1
git add src/index.html
echo Changes brought over, please check and commit.
