/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import fs from 'fs'
import { globby } from 'globby'

const distFilenameMatcher = /style-(\d+)\.css$/
const filePattern = /style-([0-9A-Za-z]+?)\.css/
const stylePattern = /href="\/style-([0-9A-Za-z]+?)\.css"/

const findOldPattern = () => {
  let content = fs.readFileSync('public/index.html', 'utf8')
  let match = stylePattern.exec(content)
  if (match) {
    return `style-${match[1]}.css`
  }

  console.error(
    `Could not find old pattern in public/index.html. Please check the file and run this script again.`
  )
  process.exit(1)
}

const fixFiles = (paths, oldPattern, newPattern) => {
  paths.forEach((path) => {
    let content = fs.readFileSync(path, 'utf8')
    let changed = false
    while (content.indexOf(oldPattern) > -1) {
      changed = true
      content = content.replace(oldPattern, newPattern)
    }

    if (changed) {
      // console.log(`would write fs.writeFileSync(${path}, content)`)
      fs.writeFileSync(path, content)
    }
  })
}

const findNewPattern = async () => {
  let newFilename = await globby(['public/style-*.css'])
  console.log(
    `... found ${newFilename.length} new filenames: ${JSON.stringify(newFilename)}`
  )
  if (newFilename.length !== 1) {
    console.error(
      `Found ${newFilename.length} new filenames. Please check the file and run this script again.`
    )
    process.exit(1)
  }
  let newPatternList = filePattern.exec(newFilename[0])
  if (!newPatternList) {
    console.error(
      `Could not find new pattern in ${newFilename[0]}. Please check the file and run this script again.`
    )
    process.exit(1)
  }

  return `style-${newPatternList[1]}.css`
}

console.log(`Entering timestamp-build-filenames.js`)
let paths = await globby([
  '**/*',
  '!node_modules',
  '!tmp',
  '!test-results',
  '!e2e-tests',
  '!run-dev.sh',
  '!prod_deploy.sh',
  '!timestamp-build-filenames.js',
])
console.log(`... found ${paths.length} files in the project`)

const newPattern = await findNewPattern()
console.log(`newPattern: ${JSON.stringify(newPattern)}`)

const oldPattern = findOldPattern()
console.log(`oldPattern: ${JSON.stringify(oldPattern)}`)
const others = paths.filter((filename) => !distFilenameMatcher.test(filename))

console.log(`... found ${oldPattern} to rename to ${newPattern}`)
console.log(`... about to fix files`)
fixFiles(others, oldPattern, newPattern)
console.log(`... done!`)
