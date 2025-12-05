import * as fs from 'fs'
import * as path from 'path'

const getRelativeFiles = (dir: string, basePath: string = dir): string[] => {
  const results: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...getRelativeFiles(fullPath, basePath))
    } else {
      results.push(path.relative(basePath, fullPath))
    }
  }

  return results
}

const removeClassAttributes = (content: string): string => {
  return content.replace(/\s*(class|className)=["'][^"']*["']/g, '')
}

const getTokens = (content: string): string[] => {
  const cleaned = removeClassAttributes(content)
  const tokens: string[] = []
  const matches = cleaned.match(/[a-zA-Z0-9]+|[^\s\w]/g) || []

  for (const match of matches) {
    tokens.push(match)
  }

  return tokens
}

interface CompareResult {
  same: boolean
  difference?: string
}

const compareFiles = (file1Path: string, file2Path: string): CompareResult => {
  const content1 = fs.readFileSync(file1Path, 'utf-8')
  const content2 = fs.readFileSync(file2Path, 'utf-8')

  const runs1 = getTokens(content1)
  const runs2 = getTokens(content2)

  if (runs1.length !== runs2.length) {
    return { same: false, difference: '<Size>' }
  }

  for (let i = 0; i < runs1.length; i++) {
    if (runs1[i] !== runs2[i]) {
      return { same: false, difference: runs1[i] }
    }
  }

  return { same: true }
}

const compareDirectories = (dir1: string, dir2: string): void => {
  const files1 = new Set(getRelativeFiles(dir1))
  const files2 = new Set(getRelativeFiles(dir2))

  const allFiles = new Set([...files1, ...files2])
  const sortedFiles = Array.from(allFiles).sort()

  for (const relPath of sortedFiles) {
    const inDir1 = files1.has(relPath)
    const inDir2 = files2.has(relPath)

    if (inDir1 && !inDir2) {
      console.log(`Left: ${relPath}`)
    } else if (!inDir1 && inDir2) {
      console.log(`Righ: ${relPath}`)
    } else {
      const fullPath1 = path.join(dir1, relPath)
      const fullPath2 = path.join(dir2, relPath)
      const result = compareFiles(fullPath1, fullPath2)

      if (result.same) {
        console.log(`Same: ${relPath}`)
      } else {
        console.log(`Diff: ${relPath}`)
      }
    }
  }
}

const compareTwoFiles = (file1: string, file2: string): void => {
  const result = compareFiles(file1, file2)

  if (result.same) {
    console.log(
      'Files are identical (ignoring class/className attributes and whitespace)'
    )
  } else {
    console.log(`First difference: ${result.difference}`)
  }
}

const main = (): void => {
  const args = process.argv.slice(2)

  if (args.length !== 2) {
    console.error(
      'Usage: npx tsx scripts/compare-without-classes.ts <path1> <path2>'
    )
    console.error('  Paths can be two directories or two files')
    process.exit(1)
  }

  const [path1, path2] = args

  if (!fs.existsSync(path1)) {
    console.error(`Error: ${path1} does not exist`)
    process.exit(1)
  }

  if (!fs.existsSync(path2)) {
    console.error(`Error: ${path2} does not exist`)
    process.exit(1)
  }

  const isDir1 = fs.statSync(path1).isDirectory()
  const isDir2 = fs.statSync(path2).isDirectory()

  if (isDir1 && isDir2) {
    compareDirectories(path1, path2)
  } else if (!isDir1 && !isDir2) {
    compareTwoFiles(path1, path2)
  } else {
    console.error('Error: Both paths must be either directories or files')
    process.exit(1)
  }
}

main()
