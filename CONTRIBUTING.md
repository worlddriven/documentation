# Contributing to Worlddriven

Welcome! We're glad you're interested in contributing to worlddriven. This project practices democratic governance—your contributions give you both voting power and responsibility for the project's direction.

## Quick Start

1. **Fork the repository** you want to contribute to
2. **Make your changes** in a feature branch
3. **Submit a pull request** to the main repository
4. **Participate in review** - your vote counts!

## Repository Management

The worlddriven organization itself is managed democratically. To propose infrastructure changes:

### Adding a New Repository

1. **Edit [REPOSITORIES.md](REPOSITORIES.md)** to add your repository:
```markdown
## my-new-repo
- Description: Brief description of what this repository does
- Topics: topic1, topic2, topic3
```

2. **Create a pull request** with your changes

3. **Review the drift detection comment** that automatically appears on your PR:
   - Shows exactly what will be created
   - Displays repository settings that will be applied
   - Previews the sync plan

4. **After democratic review and merge**:
   - Automation creates the repository on GitHub
   - Standard worlddriven settings are applied
   - Branch protection ruleset is configured
   - Initial README.md is created

### Updating Repository Metadata

To update a repository's description or topics:

1. **Edit the repository's section** in [REPOSITORIES.md](REPOSITORIES.md)
2. **Submit a pull request** - drift detection will show the changes
3. **After merge**, automation updates GitHub metadata

### Removing a Repository

**Warning**: Repository deletion is permanent. Ensure you have backups.

1. **Remove the repository section** from [REPOSITORIES.md](REPOSITORIES.md)
2. **Submit a pull request** - drift detection will warn about deletion
3. **Protected repositories** (documentation, core, webapp) will not be deleted
4. **After merge**, unprotected repositories are deleted from GitHub

## Code Contributions

### For Documentation Repository

**Areas to contribute:**
- Improve documentation clarity
- Add examples and use cases
- Fix typos and formatting
- Enhance automation scripts
- Add tests for repository parsing

**Development workflow:**
```bash
# Clone the repository
git clone https://github.com/worlddriven/documentation.git
cd documentation

# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ...

# Run tests
npm test

# Commit and push
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

### For Automation Scripts

Located in `scripts/` directory:
- `parse-repositories.js` - Parse REPOSITORIES.md format
- `detect-drift.js` - Compare desired vs actual state
- `sync-repositories.js` - Apply changes to GitHub
- `fetch-github-state.js` - Fetch current organization state

**Testing locally:**
```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Test drift detection (requires GitHub token)
export WORLDDRIVEN_GITHUB_TOKEN=your_token
node scripts/detect-drift.js

# Test sync in dry-run mode (safe, makes no changes)
node scripts/sync-repositories.js
```

**Adding tests:**
- Unit tests go in `tests/` directory
- Test repository parsing edge cases
- Validate drift detection logic
- Ensure sync plan generation is correct

## Pull Request Guidelines

### Creating Good Pull Requests

**Title**: Use conventional commit format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Add or improve tests
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

**Description**: Include:
- What changes you made
- Why you made them
- How to test them
- Related issues (if any)

**Example**:
```markdown
## Summary
Add support for repository archival in REPOSITORIES.md

## Why
Users need ability to mark repositories as archived while keeping
them in the organization for historical reference.

## Changes
- Add optional `archived: true` field to repository format
- Update parser to handle archived flag
- Add archive action to sync script

## Testing
- Added unit tests for archived repository parsing
- Tested sync with archived repository in dry-run mode

Closes #42
```

### Reviewing Pull Requests

Your review carries weight based on your contribution history:

**How to review:**
1. **Understand the changes** - Read the code and PR description
2. **Test locally** if significant - Clone the branch and verify it works
3. **Provide constructive feedback** - Suggest improvements clearly
4. **Vote with your review**:
   - ✅ **Approve** - Speeds up merge (if you have contribution history)
   - 💬 **Comment** - Neutral feedback, doesn't affect timing
   - ❌ **Request changes** - Blocks merge until addressed

**Good review comments:**
- Specific: "Line 42: This could cause X if Y happens"
- Constructive: "Consider using Z instead for better performance"
- Educational: "This pattern might be clearer: [example]"

**Less helpful:**
- Vague: "I don't like this"
- Non-actionable: "This seems wrong"
- Personal: Attacking the contributor rather than critiquing the code

## Understanding Worlddriven Voting

Pull requests automatically merge after a default time period (10 days), but the community can influence this:

**How votes work:**
- Your voting power = your contribution weight to the project
- **Approvals** from contributors reduce merge time
- **Change requests** increase merge time or block entirely
- **Coefficient** shown in GitHub status indicates net community sentiment
- **Transparent calculation** - everyone sees exactly how decisions are made

**What this means:**
- Your first contribution immediately gives you voting rights
- More contributions = more influence in project direction
- Veterans guide through influence, not absolute authority
- True democracy where those who build decide

## Automation Workflow

Understanding the automation helps you contribute effectively:

### Drift Detection Workflow
```
PR created/updated
    ↓
GitHub Actions triggered
    ↓
Parse REPOSITORIES.md (desired state)
    ↓
Fetch GitHub org (actual state)
    ↓
Detect differences
    ↓
Generate drift report
    ↓
Generate sync preview (dry-run)
    ↓
Post/update PR comment
```

### Sync Workflow
```
PR merges to main
    ↓
GitHub Actions triggered
    ↓
Execute sync script (--apply mode)
    ↓
Create repositories
    ↓
Update descriptions/topics
    ↓
Apply standard settings
    ↓
Create branch protection
    ↓
Delete unprotected repos
    ↓
Post commit comment with results
    ↓
Create issue if failures
```

## Security & Permissions

### Token Permissions

The `WORLDDRIVEN_GITHUB_TOKEN` secret requires:
- `repo` - Full repository control
- `admin:org` - Organization management
- `delete_repo` - Repository deletion

**Never**:
- Commit tokens to repository
- Share tokens publicly
- Use tokens with broader permissions than needed

### Safe Contribution

- **Forks**: Automation doesn't run on forks (no access to secrets)
- **Tests**: Test workflow runs on forks safely
- **Review**: All PRs reviewed before merge to protected main branch
- **Audit trail**: All changes visible in git history

## Code Style

### JavaScript
- Use ES modules (`import`/`export`)
- Clear variable names
- Add JSDoc comments for functions
- Follow existing code patterns
- Run tests before committing

### Markdown
- Use clear headings
- Include code examples
- Link to related documentation
- Keep line length reasonable
- Use lists for better readability

### Commit Messages
- Clear, concise, descriptive
- Use conventional commit format
- Reference issues when relevant
- Explain why, not just what

## Getting Help

- **Questions**: Open an issue with the `question` label
- **Bugs**: Open an issue with the `bug` label
- **Features**: Open an issue with the `enhancement` label
- **Discussion**: Use GitHub Discussions for broader topics

## Philosophy

Contributing to worlddriven means:

**Gaining Power**: Your contributions grant voting rights and influence

**Accepting Responsibility**: You become accountable for project direction

**Building Together**: Collective ownership through democratic process

**Practicing Democracy**: Infrastructure management mirrors code governance

## Thank You

Your contributions make worlddriven possible. By participating, you're not just submitting code—you're helping build a more democratic, sustainable model for open source governance.

Welcome to the community! 🌍
