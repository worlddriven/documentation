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

## Example

```markdown
## worlddriven-core
- Description: Democratic governance system for GitHub pull requests
- Topics: democracy, open-source, governance, automation

## worlddriven-documentation
- Description: Vision, philosophy, and organization management for worlddriven
- Topics: documentation, organization-management, governance
```

---

## Current Repositories

<!-- Add repositories below this line -->

## documentation
- Description: Core documentation repository for worlddriven project
- Topics: documentation, worlddriven

## webapp
- Description: Web application interface for worlddriven
- Topics: webapp, web, frontend, worlddriven
