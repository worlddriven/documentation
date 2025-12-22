# Worlddriven Organization Repositories

This file is the **source of truth** for all repositories in the worlddriven GitHub organization. Changes to this file democratically control our infrastructure through automated synchronization.

## How It Works

**When you create a PR modifying this file:**
- GitHub Actions automatically runs drift detection
- A comment appears showing exactly what will change (repositories to create, update, or delete)
- You can review the impact before the PR merges

**When your PR merges to main:**
- Sync automation applies changes to GitHub organization
- Repositories are created, updated, or deleted to match this file
- A commit comment shows the sync results
- If failures occur, an issue is automatically created

**Protected repositories** (documentation, core, webapp) cannot be auto-deleted but can be updated.

**Learn more**: [AUTOMATION.md](AUTOMATION.md) - Complete automation documentation

## Format

Each repository is defined using markdown headers and properties:

```markdown
## repository-name
- Description: Brief description of the repository
- Topics: topic1, topic2, topic3
```

### Properties

- **Repository Name**: Markdown heading level 2 (`##`)
- **Description** (required): Brief description of the repository's purpose
- **Topics** (optional): Comma-separated list of repository topics for discoverability
- **Origin** (optional, not yet implemented): Source repository for migration (e.g., `owner/repo-name`)

## Example

```markdown
## worlddriven-core
- Description: Democratic governance system for GitHub pull requests
- Topics: democracy, open-source, governance, automation

## worlddriven-documentation
- Description: Vision, philosophy, and organization management for worlddriven
- Topics: documentation, organization-management, governance
```

## Repository Migration

🚧 **Feature partially implemented** - Permission verification complete, transfer API pending.

The `Origin` field enables migrating repositories from "powered by worlddriven" to "worlddriven project":

- **Powered by worlddriven**: Repository stays under owner's control, uses worlddriven for PR automation
- **Worlddriven project**: Repository lives in worlddriven org with full democratic governance

### How to Grant Transfer Permissions

Before adding a repository with an `Origin` field, the repository owner must grant worlddriven admin access:

1. **Navigate to repository settings**: `https://github.com/OWNER/REPO/settings/access`
2. **Invite collaborator**: Click "Add people" or "Add teams"
3. **Add worlddriven org**: Search for and select "worlddriven"
4. **Grant admin role**: Select "Admin" permission level
5. **Confirm invitation**: worlddriven org will automatically accept

**Why admin access?** GitHub's transfer API requires admin permission on the source repository to initiate a transfer.

### Migration Workflow

**Current implementation** (permission verification):
1. ✅ Repository owner grants worlddriven admin access to origin repository
2. ✅ Add repository to REPOSITORIES.md with `Origin: owner/repo-name`
3. ✅ Drift detection automatically checks if worlddriven has admin permission
4. ✅ PR comments show permission status: "Ready" or "Blocked"
5. 🚧 On merge, repository transfer (API implementation pending)

**What's implemented:**
- ✅ Parser supports Origin field
- ✅ Permission verification via GitHub API
- ✅ Clear feedback in drift detection and PR comments
- 🚧 Transfer API call (pending - see issue #9)

**What happens when you add Origin field:**
- Drift detection checks if worlddriven has admin access to origin repo
- PR comment shows: ✅ "Ready to transfer" or ❌ "Missing admin permission"
- If permission missing, PR comment includes instructions for granting access
- Transfer action appears in sync plan (but won't execute until API is implemented)

### Example

```markdown
## my-project
- Description: My awesome democratic project
- Topics: worlddriven, democracy
- Origin: myusername/my-project
```

**Before adding**: Grant worlddriven admin access to `myusername/my-project`

Track implementation progress in GitHub issue #9.

---

## Current Repositories

<!-- Add repositories below this line -->

## documentation
- Description: Core documentation repository for worlddriven project
- Topics: documentation, worlddriven

## webapp
- Description: Web application interface for worlddriven
- Topics: webapp, web, frontend, worlddriven

## test
- Description: Test repository for migration automation
- Topics: test, migration, automation
- Origin: TooAngel/worlddriven-migration-test
