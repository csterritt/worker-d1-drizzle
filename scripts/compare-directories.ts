#!/usr/bin/env bun

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

// Get the target directory from command line arguments
const targetDir = process.argv[2]

if (!targetDir) {
  console.error('Error: Please provide a target directory as an argument')
  process.exit(1)
}

// Check if target directory exists
if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
  console.error(
    `Error: Target directory "${targetDir}" does not exist or is not a directory`
  )
  process.exit(1)
}

// Get the current directory (source directory)
const sourceDir = process.cwd()

// Directories to exclude
const excludeDirs = ['node_modules', 'test-results', 'tmp']

/**
 * Recursively compare files between source and target directories
 * @param currentPath - Current relative path being processed
 */
function compareDirectories(currentPath: string = ''): void {
  const sourcePath = path.join(sourceDir, currentPath)

  // Skip if this is an excluded directory
  if (
    excludeDirs.some(
      (dir) => currentPath.startsWith(dir + path.sep) || currentPath === dir
    )
  ) {
    return
  }

  try {
    const entries = fs.readdirSync(sourcePath, { withFileTypes: true })

    for (const entry of entries) {
      const relativePath = path.join(currentPath, entry.name)

      // Skip excluded directories
      if (
        excludeDirs.some(
          (dir) =>
            relativePath.startsWith(dir + path.sep) || relativePath === dir
        )
      ) {
        continue
      }

      const sourceFilePath = path.join(sourceDir, relativePath)
      const targetFilePath = path.join(targetDir, relativePath)

      if (entry.isDirectory()) {
        // Recursively process subdirectories
        compareDirectories(relativePath)
      } else if (entry.isFile()) {
        // Check if the file exists in the target directory
        if (
          fs.existsSync(targetFilePath) &&
          fs.statSync(targetFilePath).isFile()
        ) {
          try {
            // Run diff -w on the two files
            const diffOutput = execSync(
              `diff -w "${sourceFilePath}" "${targetFilePath}"`,
              {
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'pipe'],
              }
            )

            // If diff produces output, print the file path
            if (diffOutput.trim()) {
              console.log(relativePath)
            }
          } catch (error) {
            // Type assertion for the error object from execSync
            const execError = error as { status?: number; message?: string }

            // diff returns non-zero exit code when files differ
            if (execError.status === 1) {
              console.log(relativePath)
            } else {
              console.error(
                `Error comparing ${relativePath}: ${execError.message || 'Unknown error'}`
              )
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(
      `Error reading directory ${currentPath}: ${(error as Error).message}`
    )
  }
}

// Start the comparison
console.log(`Comparing files between current directory and ${targetDir}...`)
compareDirectories()
console.log('Comparison complete.')
