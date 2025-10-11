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

const GITHUB_API_BASE = 'https://api.github.com';
const ORG_NAME = 'worlddriven';

/**
 * Create a repository in the GitHub organization
 */
async function createRepository(token, repoData) {
  const url = `${GITHUB_API_BASE}/orgs/${ORG_NAME}/repos`;

  const body = {
    name: repoData.name,
    description: repoData.description,
    private: false,
    has_issues: true,
    has_projects: true,
    has_wiki: true,
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
 * Generate sync plan from drift
 */
function generateSyncPlan(drift) {
  const plan = {
    actions: [],
    summary: {
      create: 0,
      updateDescription: 0,
      updateTopics: 0,
      skip: 0,
    },
  };

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

  // Report extra repos (but don't delete)
  for (const repo of drift.extra) {
    plan.actions.push({
      type: 'skip',
      repo: repo.name,
      reason: 'Extra repository in GitHub - not in REPOSITORIES.md (manual deletion required)',
    });
    plan.summary.skip++;
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
          // After creating, set topics if they exist
          if (action.data.topics && action.data.topics.length > 0) {
            await updateRepositoryTopics(token, action.data.name, action.data.topics);
          }
          break;

        case 'update-description':
          result = await updateRepositoryDescription(token, action.repo, action.to);
          break;

        case 'update-topics':
          result = await updateRepositoryTopics(token, action.repo, action.to);
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
  lines.push(`- Skip (manual action needed): ${plan.summary.skip}`);
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

    // Detect drift
    console.error('🔍 Detecting drift...');
    const drift = detectDrift(desiredRepos, actualRepos);

    // Generate sync plan
    console.error('📋 Generating sync plan...');
    const plan = generateSyncPlan(drift);

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
