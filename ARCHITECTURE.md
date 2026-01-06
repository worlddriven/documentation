# Worlddriven Architecture

This document describes the high-level architecture of worlddriven. For implementation details, see the individual repository documentation.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                            GitHub                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ User Repos   │  │ worlddriven  │  │ GitHub Apps  │              │
│  │ with WD app  │  │ org repos    │  │ (2 apps)     │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
└─────────┼─────────────────┼─────────────────┼───────────────────────┘
          │ webhooks        │                 │ installation
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Worlddriven Core                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Webhook      │  │ Voting       │  │ Migration    │              │
│  │ Handler      │  │ Engine       │  │ Handler      │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                           │                                          │
│                    ┌──────▼──────┐                                  │
│                    │  MongoDB    │                                  │
│                    └─────────────┘                                  │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Worlddriven Webapp                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Dashboard    │  │ Repository   │  │ OAuth        │              │
│  │              │  │ Management   │  │ Flow         │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

## Components

### Core (Backend)

**Repository**: [worlddriven/core](https://github.com/worlddriven/core)

The core backend handles all voting logic and GitHub integration:

| Component | Responsibility |
|-----------|----------------|
| **Webhook Handler** | Receives GitHub events (PR opened, review submitted, etc.) |
| **Voting Engine** | Calculates merge coefficients based on time and reviews |
| **Status Updates** | Posts commit statuses showing merge timeline |
| **Auto-merge** | Merges PRs when voting threshold reached |
| **Migration Handler** | Processes repository transfers via migrate app |

**Key Technologies**: Node.js, Express, MongoDB

### Webapp (Frontend)

**Repository**: [worlddriven/webapp](https://github.com/worlddriven/webapp)

The webapp provides the user interface:

| Component | Responsibility |
|-----------|----------------|
| **Dashboard** | Shows repositories and their PR status |
| **Repository Management** | Enable/disable worlddriven, configure settings |
| **OAuth Flow** | GitHub authentication |

**Key Technologies**: React, Vite

### Documentation (This Repository)

**Repository**: [worlddriven/documentation](https://github.com/worlddriven/documentation)

This repository serves dual purposes:

1. **Documentation** - Project philosophy, architecture, guides
2. **Organization Management** - REPOSITORIES.md defines org structure

| Component | Responsibility |
|-----------|----------------|
| **REPOSITORIES.md** | Source of truth for org repositories |
| **Automation Scripts** | Drift detection, sync, parsing |
| **GitHub Actions** | Automated enforcement of desired state |
| **GitHub App Manifests** | App configuration documentation |

**Key Technologies**: Node.js, GitHub Actions

## GitHub Apps

Worlddriven uses two GitHub Apps, following the principle of least privilege:

### WorldDriven (Main App)

**Purpose**: PR voting and auto-merge

**Permissions**:
- `checks: write` - Create/update check runs
- `contents: write` - Merge pull requests
- `issues: write` - Comment on PRs
- `metadata: read` - Basic repository info
- `pull_requests: write` - Update PR status
- `statuses: write` - Post commit statuses
- `workflows: write` - Trigger workflow runs

**Events**:
- `pull_request` - PR opened, closed, synchronized
- `pull_request_review` - Review submitted
- `push` - Code pushed

### WorldDriven Migrate

**Purpose**: One-time repository transfers to worlddriven org

**Permissions**:
- `administration: write` - Transfer repositories
- `metadata: read` - Basic repository info

**Events**:
- `installation` - App installed (with repos)
- `installation_repositories` - Repos added to existing installation

See [github-apps/](github-apps/) for manifest files.

## Data Flow

### PR Voting Flow

```
1. User opens PR on repo with WorldDriven app installed
   │
2. GitHub sends pull_request webhook to Core
   │
3. Core calculates initial voting coefficient
   │  - Base merge time (configurable, default 10 days)
   │  - Per-commit time adjustment
   │
4. Core posts commit status: "Merge at [date]"
   │
5. Reviewer submits review (approve/request changes)
   │
6. GitHub sends pull_request_review webhook to Core
   │
7. Core recalculates coefficient
   │  - Fetch reviewer's contribution history
   │  - Calculate vote weight (commits / total commits)
   │  - Approve: reduces time, Request Changes: increases time
   │
8. Core updates commit status with new merge date
   │
9. When coefficient >= 1.0, Core merges the PR
```

### Repository Migration Flow

```
1. User adds entry to REPOSITORIES.md with Origin field
   │
2. PR is created, reviewed, and merged via worlddriven voting
   │
3. User installs WorldDriven Migrate app on their repo
   │
4. GitHub sends installation webhook to Core
   │
5. Migration Handler checks for approved migration PR
   │
6. If approved, transfers repository to worlddriven org
   │
7. Comments on PR and triggers CI re-run
```

### Organization Sync Flow

```
1. REPOSITORIES.md is modified
   │
2. PR created and merged via worlddriven voting
   │
3. GitHub Actions triggers sync workflow
   │
4. Scripts parse REPOSITORIES.md (desired state)
   │
5. Scripts fetch GitHub API (actual state)
   │
6. Drift detection compares states
   │
7. Sync applies changes to match desired state
   │
8. Protected repos (documentation, core, webapp) skip destructive changes
```

## Voting Algorithm

The voting coefficient determines when a PR merges:

```
coefficient = time_factor + vote_factor

time_factor = hours_since_opened / base_merge_hours

vote_factor = Σ (vote_value × voter_weight)
  where:
    vote_value = +1 for approve, -1 for request changes
    voter_weight = voter_commits / total_repo_commits

PR merges when: coefficient >= 1.0
```

### Example

- Base merge time: 240 hours (10 days)
- PR open for 120 hours (5 days)
- Reviewer A (10% of commits) approves: +0.1
- Reviewer B (5% of commits) requests changes: -0.05

```
coefficient = (120/240) + 0.1 - 0.05
           = 0.5 + 0.05
           = 0.55

PR needs coefficient >= 1.0, so it will wait longer or need more approvals.
```

## Deployment

### Production URLs

| Service | URL |
|---------|-----|
| Main site | https://www.worlddriven.org |
| API | https://www.worlddriven.org/api |
| Webapp | https://worlddriven-webapp.tooangel.com |

### Infrastructure

- **Hosting**: Dokku on dedicated server
- **Database**: MongoDB
- **CI/CD**: GitHub Actions

## Security Considerations

### Vote Manipulation Prevention

- Vote weight based on historical commits (not easily faked)
- All votes are public (GitHub reviews)
- Transparent calculation shown in status

### Repository Protection

- Critical repos (documentation, core, webapp) have additional protections
- Sync automation won't delete protected repos
- Branch protection rules enforced

### App Permissions

- Minimal permissions per app (least privilege)
- Separate app for admin operations (migration)
- All webhook payloads verified

## Related Documentation

- [AUTOMATION.md](AUTOMATION.md) - Detailed automation guide
- [REPOSITORIES.md](REPOSITORIES.md) - Repository configuration format
- [scripts/README.md](scripts/README.md) - Script API reference
- [github-apps/README.md](github-apps/README.md) - GitHub App details
