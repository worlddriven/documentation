#!/usr/bin/env node

/**
 * Parse REPOSITORIES.md and extract repository definitions
 * Returns an array of repository objects
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Parse markdown content and extract repository definitions
 * @param {string} content - Markdown content
 * @returns {Array<{name: string, description: string, topics?: string[]}>}
 */
function parseRepositories(content) {
  const repositories = [];
  const lines = content.split('\n');

  let currentRepo = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Repository name (## heading)
    if (line.startsWith('## ')) {
      // Save previous repo if exists
      if (currentRepo) {
        repositories.push(currentRepo);
      }

      // Start new repo
      const name = line.substring(3).trim();
      // Skip example headings or special sections
      if (name && !name.toLowerCase().includes('example') &&
          !name.toLowerCase().includes('current repositories') &&
          !name.toLowerCase().includes('format')) {
        currentRepo = { name };
      } else {
        currentRepo = null;
      }
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
