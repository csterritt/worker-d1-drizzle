#!/bin/bash
set -Eeuo

curl -s 'http://localhost:3000' > /dev/null || ( echo 'No local server running' ; exit 1 )
./clean-for-production.rb || exit 1
echo clean
git reset --hard HEAD
msg=$(./update-version.rb)
rm -f public/index.html
sleep 1
curl -s 'http://localhost:3000' > public/index.html || exit 1
sleep 1
rm -f public/style-*.css
npx @tailwindcss/cli -i ./src/style.css -o public/style-$(date '+%Y%m%d%H%M%S').css
node ./timestamp-build-filenames.js
git add public/index.html
git add public/style-*.css
git commit -a -m "$msg"

git checkout main
git merge --no-commit -s ort -Xtheirs dev || echo "Merge conflicts found, evidently."
./clean-for-production.rb ignore || exit 1
echo Changes brought over, please check and commit.
