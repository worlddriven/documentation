#!/usr/bin/env node

/**
 * Detect drift between REPOSITORIES.md and actual GitHub organization state
 * Compares desired state (REPOSITORIES.md) with actual state (GitHub API)
 */

import { parseRepositoriesFile } from './parse-repositories.js';
import { fetchGitHubRepositories } from './fetch-github-state.js';
import { checkMultipleTransferPermissions } from './check-transfer-permissions.js';

/**
 * Compare two arrays of topics
 */
function arraysEqual(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

/**
 * Detect differences between desired and actual repository states
 * @param {Array} desiredRepos - Repositories defined in REPOSITORIES.md
 * @param {Array} actualRepos - Repositories in GitHub organization
 * @param {Map} transferPermissions - Optional map of origin repo to permission results
 */
function detectDrift(desiredRepos, actualRepos, transferPermissions = new Map()) {
  const drift = {
    missing: [],        // In REPOSITORIES.md but not in GitHub
    extra: [],          // In GitHub but not in REPOSITORIES.md
    descriptionDiff: [], // Description mismatch
    topicsDiff: [],     // Topics mismatch
    pendingTransfer: [], // Repositories with origin field
    transferPermissions, // Permission status for repositories with origin
  };

  // Create lookup maps
  const desiredMap = new Map(desiredRepos.map(r => [r.name, r]));
  const actualMap = new Map(actualRepos.map(r => [r.name, r]));

  // Find missing and different repos
  for (const desired of desiredRepos) {
    const actual = actualMap.get(desired.name);

    // Check for origin field (repository transfer - not yet implemented)
    if (desired.origin) {
      drift.pendingTransfer.push(desired);
      continue; // Skip other checks for transfer repos
    }

    if (!actual) {
      drift.missing.push(desired);
    } else {
      // Check description
      if (desired.description !== actual.description) {
        drift.descriptionDiff.push({
          name: desired.name,
          desired: desired.description,
          actual: actual.description,
        });
      }

      // Check topics
      if (!arraysEqual(desired.topics, actual.topics)) {
        drift.topicsDiff.push({
          name: desired.name,
          desired: desired.topics || [],
          actual: actual.topics || [],
        });
      }
    }
  }

  // Find extra repos
  for (const actual of actualRepos) {
    if (!desiredMap.has(actual.name)) {
      drift.extra.push(actual);
    }
  }

  return drift;
}

/**
 * Format drift report as markdown
 */
function formatDriftReport(drift, desiredCount, actualCount) {
  const lines = [];

  lines.push('# 🔍 Repository Drift Report');
  lines.push('');
  lines.push(`**Summary**: ${desiredCount} repositories in REPOSITORIES.md, ${actualCount} repositories in GitHub organization`);
  lines.push('');

  const hasDrift = drift.missing.length > 0 ||
                   drift.extra.length > 0 ||
                   drift.descriptionDiff.length > 0 ||
                   drift.topicsDiff.length > 0 ||
                   drift.pendingTransfer.length > 0;

  if (!hasDrift) {
    lines.push('✅ **No drift detected** - REPOSITORIES.md matches GitHub organization state');
    return lines.join('\n');
  }

  lines.push('⚠️ **Drift detected** - Differences found between REPOSITORIES.md and GitHub');
  lines.push('');

  // Pending transfers
  if (drift.pendingTransfer.length > 0) {
    lines.push(`## 🚧 Repository Transfer Pending (${drift.pendingTransfer.length})`);
    lines.push('');
    lines.push('⚠️ **TRANSFER FEATURE IN DEVELOPMENT** - These repositories have an `Origin` field for migration:');
    lines.push('');
    for (const repo of drift.pendingTransfer) {
      const permission = drift.transferPermissions.get(repo.origin);

      lines.push(`- **${repo.name}** ← \`${repo.origin}\``);
      lines.push(`  - Description: ${repo.description}`);

      if (permission) {
        if (permission.hasPermission) {
          lines.push(`  - ✅ **Permission Status**: ${permission.details}`);
          lines.push(`  - **Ready for transfer** (once transfer automation is complete)`);
        } else {
          lines.push(`  - ❌ **Permission Status**: ${permission.details}`);
          lines.push(`  - **Action required**: Grant worlddriven admin access to ${repo.origin}`);
          lines.push(`  - See REPOSITORIES.md for instructions on granting permissions`);
        }
      } else {
        lines.push(`  - ⚠️ **Permission Status**: Not checked`);
        lines.push(`  - Run drift detection to verify permissions`);
      }
    }
    lines.push('');
    lines.push('**Note**: Transfer automation is under development. See issue #9 for progress.');
    lines.push('');
  }

  // Missing repositories
  if (drift.missing.length > 0) {
    lines.push(`## 📝 Missing in GitHub (${drift.missing.length})`);
    lines.push('');
    lines.push('These repositories are defined in REPOSITORIES.md but do not exist in GitHub:');
    lines.push('');
    for (const repo of drift.missing) {
      lines.push(`- **${repo.name}**: ${repo.description}`);
    }
    lines.push('');
  }

  // Extra repositories
  if (drift.extra.length > 0) {
    lines.push(`## ➕ Not in REPOSITORIES.md (${drift.extra.length})`);
    lines.push('');
    lines.push('These repositories exist in GitHub but are not documented in REPOSITORIES.md:');
    lines.push('');
    for (const repo of drift.extra) {
      lines.push(`- **${repo.name}**: ${repo.description || '(no description)'}`);
    }
    lines.push('');
  }

  // Description differences
  if (drift.descriptionDiff.length > 0) {
    lines.push(`## 📄 Description Mismatches (${drift.descriptionDiff.length})`);
    lines.push('');
    for (const diff of drift.descriptionDiff) {
      lines.push(`### ${diff.name}`);
      lines.push(`- **In REPOSITORIES.md**: ${diff.desired || '(empty)'}`);
      lines.push(`- **In GitHub**: ${diff.actual || '(empty)'}`);
      lines.push('');
    }
  }

  // Topics differences
  if (drift.topicsDiff.length > 0) {
    lines.push(`## 🏷️ Topics Mismatches (${drift.topicsDiff.length})`);
    lines.push('');
    for (const diff of drift.topicsDiff) {
      lines.push(`### ${diff.name}`);
      lines.push(`- **In REPOSITORIES.md**: ${diff.desired.join(', ') || '(none)'}`);
      lines.push(`- **In GitHub**: ${diff.actual.join(', ') || '(none)'}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Main function
 */
async function main() {
  const token = process.env.WORLDDRIVEN_GITHUB_TOKEN;

  if (!token) {
    console.error('❌ Error: WORLDDRIVEN_GITHUB_TOKEN environment variable is not set');
    process.exit(1);
  }

  try {
    console.error('📖 Parsing REPOSITORIES.md...');
    const desiredRepos = await parseRepositoriesFile();

    console.error('🌐 Fetching GitHub organization state...');
    const actualRepos = await fetchGitHubRepositories(token);

    // Check permissions for repositories with origin field
    const reposWithOrigin = desiredRepos.filter(r => r.origin);
    let transferPermissions = new Map();

    if (reposWithOrigin.length > 0) {
      console.error('🔐 Checking transfer permissions...');
      const originRepos = reposWithOrigin.map(r => r.origin);
      transferPermissions = await checkMultipleTransferPermissions(token, originRepos);
    }

    console.error('🔍 Detecting drift...\n');

    const drift = detectDrift(desiredRepos, actualRepos, transferPermissions);
    const report = formatDriftReport(drift, desiredRepos.length, actualRepos.length);

    console.log(report);

    // Exit with error code if drift detected (useful for CI)
    // Note: pendingTransfer is informational, not an error
    const hasDrift = drift.missing.length > 0 ||
                     drift.extra.length > 0 ||
                     drift.descriptionDiff.length > 0 ||
                     drift.topicsDiff.length > 0;

    // Warn about pending transfers
    if (drift.pendingTransfer.length > 0) {
      console.error('\n⚠️  Warning: Repository transfer feature is under development');
      console.error('   PRs with Origin field will be blocked until transfer automation is complete');

      // Check permission status
      const readyCount = drift.pendingTransfer.filter(
        r => drift.transferPermissions.get(r.origin)?.hasPermission
      ).length;
      const blockedCount = drift.pendingTransfer.length - readyCount;

      if (readyCount > 0) {
        console.error(`   ✅ ${readyCount} repository(ies) ready (admin permission granted)`);
      }
      if (blockedCount > 0) {
        console.error(`   ❌ ${blockedCount} repository(ies) blocked (missing admin permission)`);
      }
    }

    process.exit(hasDrift ? 1 : 0);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Export for use as module
export { detectDrift, formatDriftReport };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
