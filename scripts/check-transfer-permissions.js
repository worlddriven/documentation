#!/usr/bin/env node

/**
 * Check if worlddriven-migrate app is installed on a repository
 * Required for repository transfer automation
 *
 * The migrate app grants admin permission when installed, enabling transfers.
 */

import crypto from 'crypto';

const GITHUB_API_BASE = 'https://api.github.com';
const ORG_NAME = 'worlddriven';

/**
 * Generate a JWT for GitHub App authentication
 * @param {string} appId - GitHub App ID
 * @param {string} privateKey - GitHub App private key (PEM format)
 * @returns {string} JWT token
 */
function generateAppJWT(appId, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60, // Issued 60 seconds ago to account for clock drift
    exp: now + 600, // Expires in 10 minutes
    iss: appId,
  };

  // Create JWT header and payload
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');

  // Sign with private key
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${body}`);
  const signature = sign.sign(privateKey, 'base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Check if the worlddriven-migrate app is installed on the origin repository
 *
 * @param {string} appId - GitHub App ID (MIGRATE_APP_ID)
 * @param {string} privateKey - GitHub App private key (MIGRATE_APP_PRIVATE_KEY)
 * @param {string} originRepo - Repository in format "owner/repo-name"
 * @returns {Promise<{hasPermission: boolean, permissionLevel: string, details: string}>}
 */
export async function checkTransferPermission(appId, privateKey, originRepo) {
  // Support legacy call signature for backward compatibility
  // Old: checkTransferPermission(token, originRepo)
  // New: checkTransferPermission(appId, privateKey, originRepo)
  //
  // Detection: privateKey is a PEM key (starts with '-----BEGIN') for new signature,
  // or looks like a repo path (contains '/') or is empty/missing for old signature
  const isLegacyCall = !originRepo && (!privateKey || !privateKey.startsWith('-----BEGIN'));

  if (isLegacyCall) {
    // Called with old signature: (token, originRepo)
    // appId is actually the token, privateKey is actually originRepo
    return checkTransferPermissionLegacy(appId, privateKey);
  }

  if (!appId || !privateKey) {
    // No app credentials, try legacy token-based check
    const token = process.env.WORLDDRIVEN_GITHUB_TOKEN;
    if (token && originRepo) {
      return checkTransferPermissionLegacy(token, originRepo);
    }
    throw new Error('GitHub App credentials (MIGRATE_APP_ID and MIGRATE_APP_PRIVATE_KEY) are required');
  }

  if (!originRepo || !originRepo.includes('/')) {
    throw new Error('Origin repository must be in format "owner/repo-name"');
  }

  const [owner, repo] = originRepo.split('/');

  if (!owner || !repo) {
    throw new Error('Invalid origin repository format');
  }

  try {
    // Generate JWT to authenticate as the GitHub App
    const jwt = generateAppJWT(appId, privateKey);

    // Check if the app is installed on the repository
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/installation`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (response.status === 404) {
      // App is not installed on this repository
      return {
        hasPermission: false,
        permissionLevel: 'none',
        details: `❌ worlddriven-migrate app is not installed on ${originRepo}. Install at: https://github.com/apps/worlddriven-migrate`,
      };
    }

    if (!response.ok) {
      const error = await response.text();
      return {
        hasPermission: false,
        permissionLevel: 'unknown',
        details: `Failed to check app installation: ${response.status} - ${error}`,
      };
    }

    const data = await response.json();

    // App is installed - check if it has admin permission
    const permissions = data.permissions || {};
    const hasAdmin = permissions.administration === 'write' || permissions.administration === 'read';

    return {
      hasPermission: hasAdmin,
      permissionLevel: hasAdmin ? 'admin' : 'limited',
      installationId: data.id,
      details: hasAdmin
        ? `✅ worlddriven-migrate app is installed on ${originRepo} with admin permission`
        : `⚠️ worlddriven-migrate app is installed on ${originRepo} but lacks admin permission`,
    };

  } catch (error) {
    return {
      hasPermission: false,
      permissionLevel: 'error',
      details: `Error checking app installation: ${error.message}`,
    };
  }
}

/**
 * Legacy token-based permission check (fallback)
 */
async function checkTransferPermissionLegacy(token, originRepo) {
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
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (response.status === 404) {
      return {
        hasPermission: false,
        permissionLevel: 'none',
        details: `Repository ${originRepo} not found or no access`,
      };
    }

    if (!response.ok) {
      const error = await response.text();
      return {
        hasPermission: false,
        permissionLevel: 'unknown',
        details: `Failed to check permissions: ${response.status} - ${error}`,
      };
    }

    const data = await response.json();

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
 * @param {string} appId - GitHub App ID (or token for legacy)
 * @param {string} privateKey - GitHub App private key (or originRepos array for legacy)
 * @param {Array<string>} originRepos - Array of repository identifiers in format "owner/repo-name"
 * @returns {Promise<Map<string, Object>>} Map of origin repo to permission result
 */
export async function checkMultipleTransferPermissions(appId, privateKey, originRepos) {
  const results = new Map();

  // Support legacy call signature: (token, originRepos)
  if (Array.isArray(privateKey)) {
    originRepos = privateKey;
    const token = appId;
    for (const originRepo of originRepos) {
      const result = await checkTransferPermissionLegacy(token, originRepo);
      results.set(originRepo, result);
    }
    return results;
  }

  for (const originRepo of originRepos) {
    const result = await checkTransferPermission(appId, privateKey, originRepo);
    results.set(originRepo, result);
  }

  return results;
}

/**
 * Main function for CLI usage
 */
async function main() {
  const args = process.argv.slice(2);
  const appId = process.env.MIGRATE_APP_ID;
  const privateKey = process.env.MIGRATE_APP_PRIVATE_KEY;
  const token = process.env.WORLDDRIVEN_GITHUB_TOKEN;

  // Prefer app-based auth, fall back to token
  const useAppAuth = appId && privateKey;

  if (!useAppAuth && !token) {
    console.error('❌ Error: Either MIGRATE_APP_ID + MIGRATE_APP_PRIVATE_KEY or WORLDDRIVEN_GITHUB_TOKEN must be set');
    process.exit(1);
  }

  if (args.length === 0) {
    console.error('Usage: check-transfer-permissions.js <owner/repo> [<owner/repo2> ...]');
    console.error('');
    console.error('Environment variables:');
    console.error('  MIGRATE_APP_ID + MIGRATE_APP_PRIVATE_KEY - GitHub App credentials (preferred)');
    console.error('  WORLDDRIVEN_GITHUB_TOKEN - Legacy token-based auth (fallback)');
    console.error('');
    console.error('Example:');
    console.error('  check-transfer-permissions.js TooAngel/worlddriven');
    process.exit(1);
  }

  try {
    const authMethod = useAppAuth ? 'GitHub App (worlddriven-migrate)' : 'Token (legacy)';
    console.error(`Checking transfer permissions for ${args.length} repository(ies) using ${authMethod}...\n`);

    const allResults = [];

    for (const originRepo of args) {
      const result = useAppAuth
        ? await checkTransferPermission(appId, privateKey, originRepo)
        : await checkTransferPermissionLegacy(token, originRepo);

      allResults.push(result);

      console.log(`${originRepo}:`);
      console.log(`  Permission Level: ${result.permissionLevel}`);
      console.log(`  Can Transfer: ${result.hasPermission ? '✅ Yes' : '❌ No'}`);
      if (result.installationId) {
        console.log(`  Installation ID: ${result.installationId}`);
      }
      console.log(`  Details: ${result.details}`);
      console.log('');
    }

    // Exit with error if any repository doesn't have admin permission
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
