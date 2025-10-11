#!/usr/bin/env node

/**
 * Fetch current state of GitHub organization repositories
 * Uses native fetch API to query GitHub
 */

const GITHUB_API_BASE = 'https://api.github.com';
const ORG_NAME = 'worlddriven';

/**
 * Fetch all repositories for an organization
 * @param {string} token - GitHub token from WORLDDRIVEN_GITHUB_TOKEN
 * @returns {Promise<Array<{name: string, description: string, topics?: string[]}>>}
 */
async function fetchGitHubRepositories(token) {
  if (!token) {
    throw new Error('WORLDDRIVEN_GITHUB_TOKEN environment variable is required');
  }

  const repositories = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `${GITHUB_API_BASE}/orgs/${ORG_NAME}/repos?per_page=${perPage}&page=${page}&type=all`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error (${response.status}): ${error}`);
    }

    const repos = await response.json();

    if (repos.length === 0) {
      break;
    }

    // Extract relevant information
    for (const repo of repos) {
      const repoData = {
        name: repo.name,
        description: repo.description || '',
      };

      // Fetch topics if available (requires special accept header)
      if (repo.topics && repo.topics.length > 0) {
        repoData.topics = repo.topics;
      }

      repositories.push(repoData);
    }

    // Check if there are more pages
    if (repos.length < perPage) {
      break;
    }

    page++;
  }

  return repositories.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Main function for CLI usage
 */
async function main() {
  const token = process.env.WORLDDRIVEN_GITHUB_TOKEN;

  if (!token) {
    console.error('❌ Error: WORLDDRIVEN_GITHUB_TOKEN environment variable is not set');
    console.error('');
    console.error('Please set the token:');
    console.error('  export WORLDDRIVEN_GITHUB_TOKEN=your_token_here');
    process.exit(1);
  }

  try {
    console.error(`Fetching repositories for organization: ${ORG_NAME}...`);
    const repos = await fetchGitHubRepositories(token);
    console.error(`✅ Found ${repos.length} repositories\n`);
    console.log(JSON.stringify(repos, null, 2));
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Export for use as module
export { fetchGitHubRepositories };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
