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

## Repository Migration (Coming Soon)

🚧 **Feature in development** - Repository transfer automation is not yet implemented.

The `Origin` field will enable migrating repositories from "powered by worlddriven" to "worlddriven project":

- **Powered by worlddriven**: Repository stays under owner's control, uses worlddriven for PR automation
- **Worlddriven project**: Repository lives in worlddriven org with full democratic governance

**Planned workflow** (not yet functional):
1. Origin repository owner grants admin permissions to worlddriven org
2. Add repository to REPOSITORIES.md with `Origin: owner/repo-name`
3. Drift detection verifies permissions
4. On merge, repository automatically transfers to worlddriven org
5. Standard democratic configurations applied

**Current status**: Parser supports Origin field, transfer logic pending implementation.
Track progress in the GitHub issue for repository migration feature.

---

## Current Repositories

<!-- Add repositories below this line -->

## documentation
- Description: Core documentation repository for worlddriven project
- Topics: documentation, worlddriven

## webapp
- Description: Web application interface for worlddriven
- Topics: webapp, web, frontend, worlddriven
