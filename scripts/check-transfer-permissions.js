#!/usr/bin/env node

/**
 * Check if worlddrivenbot has admin permission on a repository
 * Required for repository transfer automation
 */

const GITHUB_API_BASE = 'https://api.github.com';
const ORG_NAME = 'worlddriven';

/**
 * Check if the authenticated user (worlddrivenbot) has admin permission on the origin repository
 *
 * @param {string} token - GitHub token (WORLDDRIVEN_GITHUB_TOKEN)
 * @param {string} originRepo - Repository in format "owner/repo-name"
 * @returns {Promise<{hasPermission: boolean, permissionLevel: string, details: string}>}
 */
export async function checkTransferPermission(token, originRepo) {
  if (!token) {
    throw new Error('GitHub token is required');
  }

  if (!originRepo || !originRepo.includes('/')) {
    throw new Error('Origin repository must be in format "owner/repo-name"');
  }

  const [owner, repo] = originRepo.split('/');

  if (!owner || !repo) {
    throw new Error('Invalid origin repository format');
  }

  try {
    // Check the authenticated user's permission on the origin repository
    // The repo endpoint returns permissions for the authenticated user
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    // Handle different response scenarios
    if (response.status === 404) {
      // Repository doesn't exist or user doesn't have any access
      return {
        hasPermission: false,
        permissionLevel: 'none',
        details: `Repository ${originRepo} not found or no access`,
      };
    }

    if (!response.ok) {
      // Other errors (rate limit, auth issues, etc.)
      const error = await response.text();
      return {
        hasPermission: false,
        permissionLevel: 'unknown',
        details: `Failed to check permissions: ${response.status} - ${error}`,
      };
    }

    const data = await response.json();

    // The repo response includes permissions object for the authenticated user
    const permissions = data.permissions || {};
    const hasPermission = permissions.admin === true;
    const permissionLevel = hasPermission ? 'admin' :
                           permissions.push ? 'write' :
                           permissions.pull ? 'read' : 'none';

    return {
      hasPermission,
      permissionLevel,
      details: hasPermission
        ? `✅ worlddrivenbot has admin access to ${originRepo}`
        : `❌ worlddrivenbot has "${permissionLevel}" access to ${originRepo} (admin required)`,
    };

  } catch (error) {
    // Network errors, JSON parsing errors, etc.
    return {
      hasPermission: false,
      permissionLevel: 'error',
      details: `Error checking permissions: ${error.message}`,
    };
  }
}

/**
 * Check permissions for multiple repositories
 *
 * @param {string} token - GitHub token
 * @param {Array<string>} originRepos - Array of repository identifiers in format "owner/repo-name"
 * @returns {Promise<Map<string, Object>>} Map of origin repo to permission result
 */
export async function checkMultipleTransferPermissions(token, originRepos) {
  const results = new Map();

  for (const originRepo of originRepos) {
    const result = await checkTransferPermission(token, originRepo);
    results.set(originRepo, result);
  }

  return results;
}

/**
 * Main function for CLI usage
 */
async function main() {
  const args = process.argv.slice(2);
  const token = process.env.WORLDDRIVEN_GITHUB_TOKEN;

  if (!token) {
    console.error('❌ Error: WORLDDRIVEN_GITHUB_TOKEN environment variable is not set');
    process.exit(1);
  }

  if (args.length === 0) {
    console.error('Usage: check-transfer-permissions.js <owner/repo> [<owner/repo2> ...]');
    console.error('');
    console.error('Example:');
    console.error('  check-transfer-permissions.js TooAngel/worlddriven');
    process.exit(1);
  }

  try {
    console.error(`Checking transfer permissions for ${args.length} repository(ies)...\n`);

    for (const originRepo of args) {
      const result = await checkTransferPermission(token, originRepo);
      console.log(`${originRepo}:`);
      console.log(`  Permission Level: ${result.permissionLevel}`);
      console.log(`  Can Transfer: ${result.hasPermission ? '✅ Yes' : '❌ No'}`);
      console.log(`  Details: ${result.details}`);
      console.log('');
    }

    // Exit with error if any repository doesn't have admin permission
    const allResults = await Promise.all(
      args.map(repo => checkTransferPermission(token, repo))
    );
    const allHavePermission = allResults.every(r => r.hasPermission);

    process.exit(allHavePermission ? 0 : 1);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
