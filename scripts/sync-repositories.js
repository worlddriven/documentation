#!/usr/bin/env node

/**
 * Sync GitHub organization repositories to match REPOSITORIES.md
 *
 * Modes:
 * - Dry-run (default): Show what would be applied without making changes
 * - Apply (--apply): Actually make changes to GitHub organization
 */

import { parseRepositoriesFile } from './parse-repositories.js';
import { fetchGitHubRepositories } from './fetch-github-state.js';
import { detectDrift } from './detect-drift.js';
import { checkMultipleTransferPermissions } from './check-transfer-permissions.js';

const GITHUB_API_BASE = 'https://api.github.com';
const ORG_NAME = 'worlddriven';

/**
 * Standard repository settings applied to all worlddriven repositories
 * Enforces: squash-only merges, branch cleanup, democratic workflow
 */
const STANDARD_REPO_SETTINGS = {
  allow_squash_merge: true,
  allow_merge_commit: false,
  allow_rebase_merge: false,
  allow_auto_merge: false,
  delete_branch_on_merge: true,
  allow_update_branch: false,
};

/**
 * Standard branch protection ruleset applied to default branch
 * Enforces: PR requirement, no force push, no deletion
 */
const STANDARD_BRANCH_RULESET = {
  name: 'Worlddriven Democratic Governance',
  target: 'branch',
  enforcement: 'active',
  conditions: {
    ref_name: {
      include: ['~DEFAULT_BRANCH'],
      exclude: [],
    },
  },
  rules: [
    { type: 'deletion' },
    { type: 'non_fast_forward' },
    {
      type: 'pull_request',
      parameters: {
        required_approving_review_count: 0,
        dismiss_stale_reviews_on_push: false,
        require_code_owner_review: false,
        require_last_push_approval: false,
        required_review_thread_resolution: false,
        allowed_merge_methods: ['squash'],
      },
    },
  ],
  bypass_actors: [],
};

/**
 * Create a repository in the GitHub organization
 */
async function createRepository(token, repoData) {
  const url = `${GITHUB_API_BASE}/orgs/${ORG_NAME}/repos`;

  const body = {
    name: repoData.name,
    description: repoData.description,
    private: false,
    auto_init: true, // Creates initial README and main branch
    has_issues: true,
    has_projects: true,
    has_wiki: true,
    // Apply standard settings at creation
    ...STANDARD_REPO_SETTINGS,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${error}`);
  }

  return await response.json();
}

/**
 * Create branch protection ruleset for a repository
 */
async function createBranchProtectionRuleset(token, repoName) {
  const url = `${GITHUB_API_BASE}/repos/${ORG_NAME}/${repoName}/rulesets`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(STANDARD_BRANCH_RULESET),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${error}`);
  }

  return await response.json();
}

/**
 * Update repository settings to match standard configuration
 */
async function updateRepositorySettings(token, repoName) {
  const url = `${GITHUB_API_BASE}/repos/${ORG_NAME}/${repoName}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(STANDARD_REPO_SETTINGS),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${error}`);
  }

  return await response.json();
}

/**
 * Ensure repository has standard configuration
 * Updates settings and creates ruleset if missing
 */
async function ensureStandardConfiguration(token, repoName) {
  // Update repository settings to match standard
  await updateRepositorySettings(token, repoName);

  // Check if ruleset exists
  const rulesetsUrl = `${GITHUB_API_BASE}/repos/${ORG_NAME}/${repoName}/rulesets`;
  const rulesetsResponse = await fetch(rulesetsUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!rulesetsResponse.ok) {
    throw new Error(`Failed to fetch rulesets: ${rulesetsResponse.status}`);
  }

  const rulesets = await rulesetsResponse.json();
  const existingRuleset = rulesets.find(
    (r) => r.name === STANDARD_BRANCH_RULESET.name
  );

  if (!existingRuleset) {
    // Create new ruleset
    await createBranchProtectionRuleset(token, repoName);
  }
}

/**
 * Update repository description
 */
async function updateRepositoryDescription(token, repoName, description) {
  const url = `${GITHUB_API_BASE}/repos/${ORG_NAME}/${repoName}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ description }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${error}`);
  }

  return await response.json();
}

/**
 * Update repository topics (replaces all topics)
 */
async function updateRepositoryTopics(token, repoName, topics) {
  const url = `${GITHUB_API_BASE}/repos/${ORG_NAME}/${repoName}/topics`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.mercy-preview+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ names: topics || [] }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${error}`);
  }

  return await response.json();
}

/**
 * Transfer a repository to the worlddriven organization
 * @param {string} token - GitHub token with admin access
 * @param {string} originRepo - Source repository in format "owner/repo"
 * @param {string} newName - Name for the repository in worlddriven org
 * @returns {Promise<Object>} Transfer result
 */
async function transferRepository(token, originRepo, newName) {
  const [owner, repo] = originRepo.split('/');
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/transfer`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      new_owner: ORG_NAME,
      new_name: newName,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Transfer failed (${response.status}): ${error}`);
  }

  return await response.json();
}

/**
 * Delete a repository from the GitHub organization
 */
async function deleteRepository(token, repoName) {
  const url = `${GITHUB_API_BASE}/repos/${ORG_NAME}/${repoName}`;

  const response = await fetch(url, {
    method: 'DELETE',
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

  // DELETE returns 204 No Content on success
  return { deleted: true };
}

/**
 * Check if a repository is empty (has no commits)
 */
async function checkIfRepositoryEmpty(token, repoName) {
  const url = `${GITHUB_API_BASE}/repos/${ORG_NAME}/${repoName}/commits?per_page=1`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  // 409 Conflict is returned for empty repositories
  // 200 OK is returned if commits exist
  if (response.status === 409) {
    return true;
  }

  if (response.ok) {
    return false;
  }

  // For other errors, check the response body
  const data = await response.json();
  if (data.message && data.message.toLowerCase().includes('git repository is empty')) {
    return true;
  }

  // If we can't determine, assume it's not empty to avoid accidentally initializing
  return false;
}

/**
 * Create an initial commit in a repository
 */
async function createInitialCommit(token, repoName, description) {
  const url = `${GITHUB_API_BASE}/repos/${ORG_NAME}/${repoName}/contents/README.md`;

  const content = `# ${repoName}\n\n${description || 'WorldDriven repository'}\n`;
  const encodedContent = Buffer.from(content).toString('base64');

  const body = {
    message: 'Initial commit',
    content: encodedContent,
  };

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${error}`);
  }

  return await response.json();
}

/**
 * Check existing repositories for emptiness and add initialize actions
 */
async function addInitializeActions(token, plan, actualRepos, desiredRepos) {
  // Create a map of desired repos for quick lookup
  const desiredMap = new Map(desiredRepos.map(r => [r.name, r]));

  // Check each actual repo that's also in desired state (not being deleted)
  for (const actualRepo of actualRepos) {
    const desiredRepo = desiredMap.get(actualRepo.name);

    // Skip if repo is not in desired state (will be deleted)
    if (!desiredRepo) {
      continue;
    }

    // Skip if repo is being created (will be initialized during creation)
    const isBeingCreated = plan.actions.some(
      action => action.type === 'create' && action.repo === actualRepo.name
    );
    if (isBeingCreated) {
      continue;
    }

    // Check if repository is empty
    const isEmpty = await checkIfRepositoryEmpty(token, actualRepo.name);

    if (isEmpty) {
      plan.actions.push({
        type: 'initialize',
        repo: actualRepo.name,
        description: desiredRepo.description,
      });
      plan.summary.initialize++;
    }
  }
}

/**
 * Generate sync plan from drift
 */
function generateSyncPlan(drift, desiredRepos) {
  // Protected repositories that should never be deleted
  const PROTECTED_REPOS = ['documentation', 'core', 'webapp'];

  const plan = {
    actions: [],
    summary: {
      create: 0,
      updateDescription: 0,
      updateTopics: 0,
      initialize: 0,
      ensureSettings: 0,
      delete: 0,
      skip: 0,
      transfer: 0,
      transferBlocked: 0,
    },
  };

  // Handle pending transfers (repositories with origin field)
  for (const repo of drift.pendingTransfer || []) {
    const permission = drift.transferPermissions.get(repo.origin);

    if (permission && permission.hasPermission) {
      // Permission granted - add to transfer queue (not yet implemented)
      plan.actions.push({
        type: 'transfer',
        repo: repo.name,
        origin: repo.origin,
        data: repo,
        hasPermission: true,
      });
      plan.summary.transfer++;
    } else {
      // Permission not granted or check failed - skip with reason
      plan.actions.push({
        type: 'skip',
        repo: repo.name,
        reason: permission
          ? `Transfer blocked: ${permission.details}`
          : 'Transfer blocked: Permission check failed',
      });
      plan.summary.transferBlocked++;
    }
  }

  // Create missing repositories
  for (const repo of drift.missing) {
    plan.actions.push({
      type: 'create',
      repo: repo.name,
      data: repo,
    });
    plan.summary.create++;
  }

  // Update descriptions
  for (const diff of drift.descriptionDiff) {
    plan.actions.push({
      type: 'update-description',
      repo: diff.name,
      from: diff.actual,
      to: diff.desired,
    });
    plan.summary.updateDescription++;
  }

  // Update topics
  for (const diff of drift.topicsDiff) {
    plan.actions.push({
      type: 'update-topics',
      repo: diff.name,
      from: diff.actual,
      to: diff.desired,
    });
    plan.summary.updateTopics++;
  }

  // Ensure standard settings for all existing repos (not being created or deleted)
  for (const repo of desiredRepos) {
    // Skip repos being created (they get settings during creation)
    const isBeingCreated = drift.missing.some((r) => r.name === repo.name);
    if (!isBeingCreated) {
      plan.actions.push({
        type: 'ensure-settings',
        repo: repo.name,
      });
      plan.summary.ensureSettings++;
    }
  }

  // Delete extra repos (unless protected)
  for (const repo of drift.extra) {
    if (PROTECTED_REPOS.includes(repo.name)) {
      plan.actions.push({
        type: 'skip',
        repo: repo.name,
        reason: 'Protected repository - excluded from automatic deletion',
      });
      plan.summary.skip++;
    } else {
      plan.actions.push({
        type: 'delete',
        repo: repo.name,
        data: repo,
      });
      plan.summary.delete++;
    }
  }

  return plan;
}

/**
 * Execute sync plan
 */
async function executeSyncPlan(token, plan, dryRun) {
  const results = {
    success: [],
    failures: [],
    skipped: [],
  };

  for (const action of plan.actions) {
    try {
      if (action.type === 'skip') {
        results.skipped.push({
          action,
          reason: action.reason,
        });
        continue;
      }

      if (dryRun) {
        results.success.push({
          action,
          result: 'DRY-RUN: Would be applied',
        });
        continue;
      }

      // Apply the action
      let result;
      switch (action.type) {
        case 'create':
          result = await createRepository(token, action.data);
          // Apply branch protection after creation (main branch now exists via auto_init)
          await createBranchProtectionRuleset(token, action.data.name);
          // After creating, set topics if they exist
          if (action.data.topics && action.data.topics.length > 0) {
            await updateRepositoryTopics(token, action.data.name, action.data.topics);
          }
          break;

        case 'ensure-settings':
          result = await ensureStandardConfiguration(token, action.repo);
          break;

        case 'initialize':
          result = await createInitialCommit(token, action.repo, action.description);
          break;

        case 'update-description':
          result = await updateRepositoryDescription(token, action.repo, action.to);
          break;

        case 'update-topics':
          result = await updateRepositoryTopics(token, action.repo, action.to);
          break;

        case 'delete':
          result = await deleteRepository(token, action.repo);
          break;

        case 'transfer':
          result = await transferRepository(token, action.origin, action.repo);
          // Apply standard settings after transfer completes
          // Note: Transfer is async on GitHub's side, settings may need retry
          try {
            await ensureStandardConfiguration(token, action.repo);
            if (action.data.topics && action.data.topics.length > 0) {
              await updateRepositoryTopics(token, action.repo, action.data.topics);
            }
          } catch (configError) {
            // Transfer succeeded but config failed - log but don't fail
            console.error(`Warning: Transfer succeeded but post-transfer config failed: ${configError.message}`);
          }
          break;

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      results.success.push({
        action,
        result: 'Applied successfully',
      });

    } catch (error) {
      results.failures.push({
        action,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Format sync results as markdown
 */
function formatSyncReport(plan, results, dryRun) {
  const lines = [];

  const mode = dryRun ? '🔍 DRY-RUN' : '✅ APPLY';
  lines.push(`# ${mode} Repository Sync Report`);
  lines.push('');

  if (plan.actions.length === 0) {
    lines.push('✅ **No changes needed** - GitHub organization matches REPOSITORIES.md');
    return lines.join('\n');
  }

  lines.push(`**Summary**: ${plan.actions.length} total actions`);
  lines.push(`- Create: ${plan.summary.create}`);
  lines.push(`- Update descriptions: ${plan.summary.updateDescription}`);
  lines.push(`- Update topics: ${plan.summary.updateTopics}`);
  lines.push(`- Initialize (add first commit): ${plan.summary.initialize}`);
  lines.push(`- Ensure settings: ${plan.summary.ensureSettings}`);
  lines.push(`- Delete: ${plan.summary.delete}`);
  if (plan.summary.transfer > 0) {
    lines.push(`- Transfer (ready): ${plan.summary.transfer}`);
  }
  if (plan.summary.transferBlocked > 0) {
    lines.push(`- Transfer (blocked): ${plan.summary.transferBlocked}`);
  }
  lines.push(`- Skip (protected): ${plan.summary.skip}`);
  lines.push('');

  // Success
  if (results.success.length > 0) {
    const header = dryRun ? '📋 Actions to Apply' : '✅ Successfully Applied';
    lines.push(`## ${header} (${results.success.length})`);
    lines.push('');
    for (const item of results.success) {
      const action = item.action;
      switch (action.type) {
        case 'create':
          lines.push(`- **Create** \`${action.repo}\``);
          lines.push(`  - Description: ${action.data.description}`);
          if (action.data.topics && action.data.topics.length > 0) {
            lines.push(`  - Topics: ${action.data.topics.join(', ')}`);
          }
          break;

        case 'update-description':
          lines.push(`- **Update description** for \`${action.repo}\``);
          lines.push(`  - From: ${action.from || '(empty)'}`);
          lines.push(`  - To: ${action.to || '(empty)'}`);
          break;

        case 'update-topics':
          lines.push(`- **Update topics** for \`${action.repo}\``);
          lines.push(`  - From: ${action.from.join(', ') || '(none)'}`);
          lines.push(`  - To: ${action.to.join(', ') || '(none)'}`);
          break;

        case 'initialize':
          lines.push(`- **Initialize** \`${action.repo}\` (create first commit)`);
          lines.push(`  - Description: ${action.description}`);
          break;

        case 'ensure-settings':
          lines.push(`- **Ensure settings** for \`${action.repo}\``);
          lines.push(`  - Applied standard configuration`);
          break;

        case 'delete':
          lines.push(`- **Delete** \`${action.repo}\``);
          if (action.data.description) {
            lines.push(`  - Description: ${action.data.description}`);
          }
          break;

        case 'transfer':
          lines.push(`- **Transfer** \`${action.origin}\` → \`${ORG_NAME}/${action.repo}\``);
          lines.push(`  - Description: ${action.data.description}`);
          lines.push(`  - ⚠️ **Not yet implemented** - Transfer API call pending`);
          if (action.data.topics && action.data.topics.length > 0) {
            lines.push(`  - Topics: ${action.data.topics.join(', ')}`);
          }
          break;
      }
      lines.push('');
    }
  }

  // Failures
  if (results.failures.length > 0) {
    lines.push(`## ❌ Failed (${results.failures.length})`);
    lines.push('');
    for (const item of results.failures) {
      const action = item.action;
      lines.push(`- **${action.type}** for \`${action.repo}\``);
      lines.push(`  - Error: ${item.error}`);
      lines.push('');
    }
  }

  // Skipped
  if (results.skipped.length > 0) {
    lines.push(`## ⚠️ Skipped - Manual Action Required (${results.skipped.length})`);
    lines.push('');
    for (const item of results.skipped) {
      lines.push(`- \`${item.action.repo}\`: ${item.reason}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');
  const token = process.env.WORLDDRIVEN_GITHUB_TOKEN;

  if (!token) {
    console.error('❌ Error: WORLDDRIVEN_GITHUB_TOKEN environment variable is not set');
    process.exit(1);
  }

  try {
    // Determine mode
    if (dryRun) {
      console.error('🔍 Running in DRY-RUN mode (no changes will be made)');
      console.error('   Use --apply to actually apply changes');
    } else {
      console.error('✅ Running in APPLY mode (changes will be made to GitHub)');
    }
    console.error('');

    // Load desired state
    console.error('📖 Parsing REPOSITORIES.md...');
    const desiredRepos = await parseRepositoriesFile();

    // Fetch actual state
    console.error('🌐 Fetching GitHub organization state...');
    const actualRepos = await fetchGitHubRepositories(token);

    // Check permissions for repositories with origin field
    const reposWithOrigin = desiredRepos.filter(r => r.origin);
    let transferPermissions = new Map();

    if (reposWithOrigin.length > 0) {
      console.error('🔐 Checking transfer permissions...');
      const originRepos = reposWithOrigin.map(r => r.origin);

      // Use app-based auth if credentials are available
      const appId = process.env.MIGRATE_APP_ID;
      const privateKey = process.env.MIGRATE_APP_PRIVATE_KEY;

      if (appId && privateKey) {
        console.error('   Using GitHub App authentication (worlddriven-migrate)');
        transferPermissions = await checkMultipleTransferPermissions(appId, privateKey, originRepos);
      } else {
        console.error('   Using legacy token authentication');
        transferPermissions = await checkMultipleTransferPermissions(token, originRepos);
      }
    }

    // Detect drift
    console.error('🔍 Detecting drift...');
    const drift = detectDrift(desiredRepos, actualRepos, transferPermissions);

    // Check for pending transfers
    if (drift.pendingTransfer && drift.pendingTransfer.length > 0) {
      console.error('');
      console.error('🚧 INFO: Repository transfer feature under development');
      console.error(`   Found ${drift.pendingTransfer.length} repository(ies) with Origin field:`);

      const readyCount = drift.pendingTransfer.filter(
        r => drift.transferPermissions.get(r.origin)?.hasPermission
      ).length;
      const blockedCount = drift.pendingTransfer.length - readyCount;

      for (const repo of drift.pendingTransfer) {
        const permission = drift.transferPermissions.get(repo.origin);
        const status = permission?.hasPermission ? '✅' : '❌';
        console.error(`   ${status} ${repo.name} ← ${repo.origin}`);
      }

      if (readyCount > 0) {
        console.error(`   ✅ ${readyCount} ready for transfer (admin permission granted)`);
      }
      if (blockedCount > 0) {
        console.error(`   ❌ ${blockedCount} blocked (missing admin permission)`);
      }
      console.error('   Transfer API implementation pending - see issue #9');
      console.error('');
    }

    // Generate sync plan
    console.error('📋 Generating sync plan...');
    const plan = generateSyncPlan(drift, desiredRepos);

    // Check for empty repositories and add initialize actions
    console.error('🔍 Checking for empty repositories...');
    await addInitializeActions(token, plan, actualRepos, desiredRepos);

    // Execute plan
    console.error(`${dryRun ? '🔍' : '⚡'} ${dryRun ? 'Simulating' : 'Executing'} sync plan...`);
    console.error('');
    const results = await executeSyncPlan(token, plan, dryRun);

    // Format and output report
    const report = formatSyncReport(plan, results, dryRun);
    console.log(report);

    // Exit with error if there were failures
    process.exit(results.failures.length > 0 ? 1 : 0);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export for use as module
export { generateSyncPlan, executeSyncPlan, formatSyncReport };
