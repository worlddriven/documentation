# Automation Scripts Reference

This directory contains the automation scripts that manage the worlddriven GitHub organization based on REPOSITORIES.md as the source of truth.

## Overview

The automation system consists of four main scripts that work together to synchronize the GitHub organization with the desired state defined in REPOSITORIES.md:

1. **parse-repositories.js** - Parses REPOSITORIES.md markdown format
2. **fetch-github-state.js** - Fetches current GitHub organization state
3. **detect-drift.js** - Compares desired vs actual state
4. **sync-repositories.js** - Applies changes to GitHub organization

## Scripts

### parse-repositories.js

**Purpose**: Parses REPOSITORIES.md to extract repository definitions.

**Usage**:
```javascript
import { parseRepositoriesFile } from './parse-repositories.js';

const repositories = await parseRepositoriesFile();
// Returns array of { name, description, topics }
```

**Features**:
- Extracts repository name from markdown h2 headings (`## repo-name`)
- Parses description from `- Description: ...` lines
- Parses topics from `- Topics: topic1, topic2, topic3` lines
- Validates required fields (name and description)
- Skips code blocks (between triple backticks) to ignore examples
- Handles optional topics field

**Error Handling**:
- Throws error if repository missing required description
- Skips malformed entries with warnings
- Validates markdown structure

**Example Repository Definition**:
```markdown
## my-repository
- Description: A brief description of what this repository does
- Topics: topic1, topic2, topic3
```

### fetch-github-state.js

**Purpose**: Fetches current repository state from GitHub organization.

**Usage**:
```javascript
import { fetchGitHubRepositories } from './fetch-github-state.js';

const token = process.env.WORLDDRIVEN_GITHUB_TOKEN;
const repositories = await fetchGitHubRepositories(token);
// Returns array of { name, description, topics }
```

**Features**:
- Fetches all repositories in worlddriven organization
- Handles pagination for large organizations
- Extracts repository names, descriptions, and topics
- Uses GitHub REST API v3

**API Calls**:
- `GET /orgs/worlddriven/repos` - List organization repositories
- Handles rate limiting gracefully
- Supports pagination via Link headers

**Returns**:
```javascript
[
  {
    name: "repository-name",
    description: "Repository description",
    topics: ["topic1", "topic2"]
  },
  // ...
]
```

### detect-drift.js

**Purpose**: Compares desired state (REPOSITORIES.md) with actual state (GitHub organization) and identifies differences.

**Usage**:
```javascript
import { detectDrift } from './detect-drift.js';

const drift = detectDrift(desiredRepos, actualRepos);
```

**Detects**:
- **Missing repositories**: In REPOSITORIES.md but not on GitHub
- **Extra repositories**: On GitHub but not in REPOSITORIES.md
- **Description drift**: Descriptions don't match
- **Topic drift**: Topics don't match

**Returns**:
```javascript
{
  missing: [{ name, description, topics }],      // To be created
  extra: [{ name, description, topics }],        // To be deleted
  descriptionDiff: [{ name, actual, desired }],  // To be updated
  topicsDiff: [{ name, actual, desired }]        // To be updated
}
```

**CLI Usage**:
```bash
# Requires WORLDDRIVEN_GITHUB_TOKEN environment variable
export WORLDDRIVEN_GITHUB_TOKEN=your_token_here
node scripts/detect-drift.js
```

**Output**: Markdown-formatted drift report showing all differences.

### sync-repositories.js

**Purpose**: Main synchronization engine that applies changes to GitHub organization.

**Usage**:
```bash
# Dry-run mode (default) - shows what would happen without making changes
export WORLDDRIVEN_GITHUB_TOKEN=your_token_here
node scripts/sync-repositories.js

# Apply mode - actually makes changes
node scripts/sync-repositories.js --apply
```

**Modes**:
- **Dry-run** (default): Shows what would be applied without making changes
- **Apply** (`--apply` flag): Actually applies changes to GitHub

**Actions**:
1. **Create repositories**: Creates missing repositories with auto_init
2. **Update descriptions**: Updates repository descriptions
3. **Update topics**: Updates repository topics
4. **Ensure settings**: Applies standard repository settings and branch protection
5. **Initialize empty repos**: Adds first commit to empty repositories
6. **Delete repositories**: Deletes extra repositories (except protected ones)

**Standard Settings Applied**:
```javascript
{
  allow_squash_merge: true,
  allow_merge_commit: false,
  allow_rebase_merge: false,
  allow_auto_merge: false,
  delete_branch_on_merge: true,
  allow_update_branch: false
}
```

**Branch Protection Ruleset**:
- Name: "Worlddriven Democratic Governance"
- Applies to default branch
- Requires pull request (no direct commits)
- Prevents force push and branch deletion
- Allows squash merge only
- No bypass actors (applies to everyone)

**Protected Repositories**:
The following repositories cannot be auto-deleted:
- `documentation` - This repository
- `core` - The worlddriven application server
- `webapp` - The worlddriven web interface

**Exit Codes**:
- `0` - Success (all actions completed)
- `1` - Failure (one or more actions failed)

**Environment Variables**:
- `WORLDDRIVEN_GITHUB_TOKEN` (required) - GitHub Personal Access Token with:
  - `repo` - Full control of repositories
  - `admin:org` - Manage organization
  - `delete_repo` - Delete repositories

## Development

### Running Tests

```bash
npm test
```

Tests are located in `../tests/` directory and cover:
- Repository parsing logic
- Edge cases in markdown format
- Code block handling
- Validation of required fields

### Local Testing

```bash
# Set your GitHub token
export WORLDDRIVEN_GITHUB_TOKEN=ghp_your_token_here

# Test parsing
node scripts/parse-repositories.js

# Test drift detection (read-only)
node scripts/detect-drift.js

# Test sync in dry-run mode (read-only, safe)
node scripts/sync-repositories.js

# Apply changes (CAUTION: Makes real changes!)
node scripts/sync-repositories.js --apply
```

### Adding New Features

When modifying the automation scripts:

1. **Update parser** (`parse-repositories.js`) if adding new repository properties
2. **Update drift detection** (`detect-drift.js`) to detect new property differences
3. **Update sync** (`sync-repositories.js`) to apply new property changes
4. **Add tests** in `../tests/` directory
5. **Update documentation** in this file and AUTOMATION.md

### Error Handling

All scripts handle errors gracefully:
- **Network errors**: Retry logic for transient failures
- **API errors**: Clear error messages with HTTP status codes
- **Validation errors**: Specific error messages about what's wrong
- **Rate limiting**: Respect GitHub API rate limits

### Debugging

Enable verbose output:
```bash
# Scripts log to stderr for status updates
# Actual reports go to stdout for piping
node scripts/sync-repositories.js 2>&1 | tee sync-log.txt
```

## GitHub Actions Integration

These scripts are used by GitHub Actions workflows:

### Drift Detection Workflow
**File**: `.github/workflows/drift-detection.yml`
**Trigger**: PRs modifying REPOSITORIES.md
**Script**: `node scripts/detect-drift.js`
**Output**: PR comment showing drift

### Sync Workflow
**File**: `.github/workflows/sync-repositories.yml`
**Trigger**: Push to main branch
**Script**: `node scripts/sync-repositories.js --apply`
**Output**: Commit comment with sync results

See [AUTOMATION.md](../AUTOMATION.md) for complete workflow documentation.

## API Reference

### parseRepositoriesFile()

```javascript
/**
 * Parse REPOSITORIES.md and extract repository definitions
 * @returns {Promise<Array<Repository>>} Array of repository objects
 * @throws {Error} If required fields are missing
 */
async function parseRepositoriesFile(): Promise<Repository[]>

interface Repository {
  name: string          // Repository name (required)
  description: string   // Repository description (required)
  topics?: string[]     // Optional topics
}
```

### fetchGitHubRepositories(token)

```javascript
/**
 * Fetch current repository state from GitHub organization
 * @param {string} token - GitHub Personal Access Token
 * @returns {Promise<Array<Repository>>} Current GitHub repositories
 * @throws {Error} If API call fails
 */
async function fetchGitHubRepositories(token: string): Promise<Repository[]>
```

### detectDrift(desired, actual)

```javascript
/**
 * Compare desired and actual repository state
 * @param {Array<Repository>} desired - Desired repositories from REPOSITORIES.md
 * @param {Array<Repository>} actual - Current GitHub repositories
 * @returns {Drift} Object describing all differences
 */
function detectDrift(desired: Repository[], actual: Repository[]): Drift

interface Drift {
  missing: Repository[]           // In REPOSITORIES.md but not GitHub
  extra: Repository[]             // On GitHub but not in REPOSITORIES.md
  descriptionDiff: DescDiff[]    // Description mismatches
  topicsDiff: TopicDiff[]        // Topic mismatches
}
```

## Troubleshooting

### "WORLDDRIVEN_GITHUB_TOKEN environment variable is not set"

**Solution**: Set the environment variable with your GitHub Personal Access Token:
```bash
export WORLDDRIVEN_GITHUB_TOKEN=ghp_your_token_here
```

### "GitHub API error (403)"

**Possible causes**:
- Token doesn't have required permissions
- Rate limit exceeded
- Resource not accessible with this token type

**Solutions**:
- Verify token has `repo`, `admin:org`, and `delete_repo` scopes
- Wait for rate limit to reset
- Use GitHub App authentication instead of PAT

### "Repository not found" when syncing

**Cause**: Repository was already deleted or never existed

**Solution**: Run drift detection first to see current state

### Sync fails with conflicts

**Cause**: Manual changes made to GitHub that conflict with REPOSITORIES.md

**Solution**: Either:
1. Update REPOSITORIES.md to match GitHub (revert manual changes)
2. Re-run sync to overwrite GitHub with REPOSITORIES.md state

## Security Considerations

- **Token Security**: Never commit tokens to repository
- **Least Privilege**: Token should only have necessary permissions
- **Audit Logging**: All changes logged in commit comments and workflow summaries
- **Protected Repos**: Critical infrastructure protected from auto-deletion
- **Transparency**: All changes visible in git history

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on:
- Proposing automation improvements
- Adding new features
- Testing changes
- Security best practices
