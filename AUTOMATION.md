# Organization Automation

This repository practices what it preaches: **democratic infrastructure management through pull requests**. The worlddriven organization is managed entirely through code, with REPOSITORIES.md as the source of truth.

## Purpose

As described in our vision for [Phase 2: Transparent Service Management](README.md#vision-three-phases), infrastructure decisions should be made democratically, just like code. This automation system enables:

- **Democratic control**: Any contributor can propose organization changes via pull requests
- **Transparency**: All infrastructure changes are visible in git history
- **Consistency**: Standard configurations are automatically enforced
- **Accountability**: Changes are tied to commits and contributors

## How It Works

### Source of Truth

**[REPOSITORIES.md](REPOSITORIES.md)** defines all repositories in the worlddriven organization. When this file changes, automation ensures GitHub matches the desired state.

```markdown
## repository-name
- Description: Brief description of the repository
- Topics: topic1, topic2, topic3
```

### Automation Workflow

**1. Pull Request Phase** (Drift Detection)
- You modify REPOSITORIES.md and create a PR
- GitHub Actions automatically runs drift detection
- A comment appears showing exactly what will change:
  - Repositories to be created
  - Descriptions/topics to be updated
  - Repositories to be deleted (with protected repo warnings)
  - Settings to be standardized

**2. Review Phase** (Democratic Decision)
- Contributors review the proposed changes
- Discussion happens in the PR
- Worlddriven's voting system determines merge timing

**3. Merge Phase** (Automatic Sync)
- PR merges to main
- Sync workflow executes with APPLY mode
- Changes are applied to GitHub organization:
  - Creates new repositories
  - Updates existing repositories
  - Deletes repositories not in REPOSITORIES.md
  - Applies standard configurations
  - Sets up branch protection
- Commit comment shows sync results
- Issue created if any failures occur

## Standard Configurations

All worlddriven repositories automatically receive these settings to support democratic governance:

### Repository Settings
- **Merge strategy**: Squash only (1 PR = 1 commit for fair voting)
- **Auto-merge**: Disabled (worlddriven controls merging)
- **Branch cleanup**: Delete branches after merge
- **Update branch**: Disabled

### Branch Protection Ruleset: "Worlddriven Democratic Governance"
Applied to default branch (usually `main`):
- **Pull request required**: All changes must go through PR workflow
- **No force push**: Prevents history rewriting
- **No branch deletion**: Protects main branch
- **Allowed merge method**: Squash only
- **No bypass actors**: True democracy applies to everyone

### Repository Initialization
New repositories are created with:
- Public visibility
- Initial README.md file (created via auto_init)
- Issues, Projects, and Wiki enabled
- Standard settings pre-applied
- Branch protection ruleset active

## Protected Repositories

Three infrastructure repositories are protected from automatic deletion:

- **documentation** - This repository (organization management)
- **core** - The worlddriven application server
- **webapp** - The worlddriven web interface

These repositories can still be updated (descriptions, topics, settings) but won't be deleted if removed from REPOSITORIES.md. This prevents accidental deletion of critical infrastructure.

## GitHub Actions Workflows

### 1. Drift Detection (`.github/workflows/drift-detection.yml`)

**Triggers**: PRs that modify REPOSITORIES.md, scripts, or workflows

**Purpose**: Show what will happen before changes merge

**Actions**:
- Parses REPOSITORIES.md
- Fetches current GitHub organization state
- Compares desired vs actual state
- Runs sync in dry-run mode (no changes made)
- Comments on PR with drift report and sync preview
- Updates existing comment instead of creating duplicates

**Example Output**:
```
# Drift Detection Report

Missing (in REPOSITORIES.md but not GitHub):
- new-project

Extra (in GitHub but not REPOSITORIES.md):
- old-experiment

Description Drift:
- existing-repo: "Old description" → "Updated description"

# Dry-Run Sync Preview

Would create:
- new-project (Description: A new worlddriven project)

Would delete:
- old-experiment (unprotected repository)
```

### 2. Repository Sync (`.github/workflows/sync-repositories.yml`)

**Triggers**: Push to main branch

**Purpose**: Apply infrastructure changes to GitHub

**Permissions**:
- Runs only on worlddriven organization (not forks)
- Requires WORLDDRIVEN_GITHUB_TOKEN secret

**Actions**:
- Executes sync-repositories.js with --apply flag
- Creates/updates/deletes repositories
- Applies standard configurations
- Posts commit comment with results
- Creates issue if failures occur
- Adds report to workflow summary

**Example Output**:
```
✅ APPLY Repository Sync Report

Summary: 3 total actions
- Create: 1
- Update descriptions: 1
- Delete: 1

✅ Successfully Applied (3)
- Create new-project
- Update description for existing-repo
- Delete old-experiment
```

### 3. Test Suite (`.github/workflows/test.yml`)

**Triggers**: All PRs

**Purpose**: Validate automation scripts work correctly

**Actions**:
- Runs unit tests for parse-repositories.js
- Validates REPOSITORIES.md syntax
- Ensures scripts can execute

## Scripts Reference

### `scripts/sync-repositories.js`

Main synchronization engine that applies changes to GitHub.

**Usage**:
```bash
# Dry-run (show what would happen)
WORLDDRIVEN_GITHUB_TOKEN=xxx node scripts/sync-repositories.js

# Apply changes
WORLDDRIVEN_GITHUB_TOKEN=xxx node scripts/sync-repositories.js --apply
```

**Capabilities**:
- Create repositories with standard settings
- Update repository descriptions and topics
- Delete repositories (except protected ones)
- Apply/enforce standard repository settings
- Create branch protection rulesets
- Initialize empty repositories

### `scripts/detect-drift.js`

Compares desired state (REPOSITORIES.md) with actual state (GitHub).

**Detects**:
- Missing repositories
- Extra repositories
- Description differences
- Topic differences

### `scripts/parse-repositories.js`

Parses REPOSITORIES.md markdown format.

**Features**:
- Extracts repository definitions
- Validates required fields (name, description)
- Skips code blocks and examples
- Handles optional topics

### `scripts/fetch-github-state.js`

Fetches current GitHub organization repository state via API.

**Returns**:
- Repository names
- Descriptions
- Topics
- Handles pagination

## Security Model

### Authentication

The sync automation uses a GitHub Personal Access Token stored as `WORLDDRIVEN_GITHUB_TOKEN` in repository secrets.

**Required permissions**:
- `repo` - Full control of repositories
- `admin:org` - Manage organization settings
- `delete_repo` - Delete repositories

### Permissions

- **Forks**: Workflows are restricted to worlddriven organization only
- **Tests**: Test workflow runs on all repos including forks (no secrets needed)
- **Secrets**: Organization secrets are not accessible to fork PRs

### Safety Features

- **Protected repositories**: Cannot be auto-deleted
- **Dry-run preview**: See changes before merge
- **Atomic operations**: Each action is independent
- **Failure isolation**: One failure doesn't stop other operations
- **Audit trail**: All changes visible in git history and workflow logs

## Examples

### Adding a New Repository

1. Create a PR modifying REPOSITORIES.md:
```markdown
## my-new-project
- Description: An experimental worlddriven integration
- Topics: experiment, integration, worlddriven
```

2. Drift detection comments on your PR showing it will create the repository

3. After PR merges, sync workflow:
   - Creates `worlddriven/my-new-project`
   - Sets description and topics
   - Applies standard settings
   - Creates branch protection ruleset
   - Initializes with README.md

### Updating Repository Metadata

1. Edit description in REPOSITORIES.md:
```markdown
## my-new-project
- Description: Production-ready worlddriven integration (updated!)
- Topics: integration, worlddriven, production
```

2. Drift detection shows description and topic changes

3. After merge, sync workflow updates GitHub metadata

### Removing a Repository

1. Remove repository section from REPOSITORIES.md

2. Drift detection warns:
   - If protected: "Would skip - protected repository"
   - If unprotected: "Would delete repository-name"

3. After merge:
   - Protected repos: Skipped with warning in logs
   - Unprotected repos: Deleted from GitHub

**Important**: Repository deletion is permanent. Ensure you have backups.

## Troubleshooting

### Sync Failures

If sync fails, an issue is automatically created with:
- Error details
- Which actions failed
- Commit SHA that triggered the failure

Common failures:
- **403 errors**: Token permissions issue
- **409 errors**: Conflicts (e.g., repository already exists)
- **Rate limits**: Too many API calls (wait and retry)

### Manual Intervention

If automation fails and manual fixes are needed:

1. Fix the issue in GitHub directly
2. Update REPOSITORIES.md to match actual state
3. Next sync will detect no drift

### Testing Changes

To test automation changes locally:

```bash
# Install dependencies
npm install

# Run tests
npm test

# Dry-run sync (requires token)
export WORLDDRIVEN_GITHUB_TOKEN=your_token
node scripts/sync-repositories.js
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details on:
- How to propose organization changes
- Automation script development
- Testing guidelines
- Security considerations

## Philosophy

This automation embodies worlddriven's core principle: **those who contribute should govern**. By managing infrastructure through pull requests, we ensure:

- **Transparency**: All decisions visible in git history
- **Democracy**: Anyone can propose changes
- **Meritocracy**: Contribution weight determines influence
- **Accountability**: Changes are attributed and reversible

The automation removes gatekeepers while maintaining safety through standard configurations and protected repositories.
