#!/usr/bin/env node

/**
 * Parse REPOSITORIES.md and extract repository definitions
 * Returns an array of repository objects
 */

import { readFile, access } from 'fs/promises';
import { constants } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Parse markdown content and extract repository definitions
 * @param {string} content - Markdown content
 * @returns {Array<{name: string, description: string, topics?: string[], origin?: string}>}
 */
function parseRepositories(content) {
  const repositories = [];
  const lines = content.split('\n');

  let currentRepo = null;
  let inCodeBlock = false;
  let inRepositoriesSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Track code block boundaries
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // Skip lines inside code blocks
    if (inCodeBlock) {
      continue;
    }

    // Check for "Current Repositories" marker
    if (line.startsWith('## ') && line.toLowerCase().includes('current repositories')) {
      inRepositoriesSection = true;
      continue;
    }

    // Repository name (## heading) - only after "Current Repositories" section
    if (line.startsWith('## ') && inRepositoriesSection) {
      // Save previous repo if exists
      if (currentRepo) {
        repositories.push(currentRepo);
      }

      // Start new repo
      const name = line.substring(3).trim();
      currentRepo = { name };
    }
    // Properties (- Key: Value)
    else if (currentRepo && line.startsWith('- ')) {
      const propertyMatch = line.match(/^- ([^:]+):\s*(.+)$/);
      if (propertyMatch) {
        const [, key, value] = propertyMatch;
        const keyLower = key.trim().toLowerCase();

        if (keyLower === 'description') {
          currentRepo.description = value.trim();
        } else if (keyLower === 'topics') {
          currentRepo.topics = value.split(',').map(t => t.trim()).filter(Boolean);
        } else if (keyLower === 'origin') {
          currentRepo.origin = value.trim();
        }
      }
    }
  }

  // Add last repo if exists
  if (currentRepo) {
    repositories.push(currentRepo);
  }

  // Validate repositories
  const validated = repositories.filter(repo => {
    if (!repo.name) {
      console.warn('⚠️  Skipping repository without name');
      return false;
    }
    if (!repo.description) {
      console.warn(`⚠️  Repository "${repo.name}" is missing required description`);
      return false;
    }
    return true;
  });

  return validated;
}

/**
 * Read and parse REPOSITORIES.md file
 * @returns {Promise<Array>}
 */
async function parseRepositoriesFile() {
  const repoFilePath = join(__dirname, '..', 'REPOSITORIES.md');

  // Validate file exists before attempting to read
  try {
    await access(repoFilePath, constants.R_OK);
  } catch {
    console.error(`Error: REPOSITORIES.md not found at ${repoFilePath}`);
    process.exit(1);
  }

  try {
    const content = await readFile(repoFilePath, 'utf-8');
    return parseRepositories(content);
  } catch (error) {
    console.error(`Error reading REPOSITORIES.md: ${error.message}`);
    process.exit(1);
  }
}

// Export for use as module
export { parseRepositories, parseRepositoriesFile };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const repos = await parseRepositoriesFile();
  console.log(JSON.stringify(repos, null, 2));
}
