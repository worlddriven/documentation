# Worlddriven Documentation

**Worlddriven is democratic governance for open source software.** It transforms code contributions into voting power, giving every contributor both the ability and responsibility to steer project direction.

## Quick Navigation

| I want to... | Go to |
|--------------|-------|
| Understand the worlddriven idea | [Philosophy](#the-worlddriven-idea) |
| See how the system works | [Architecture](ARCHITECTURE.md) |
| Add a repository to worlddriven org | [Repository Management](#repository-management) |
| Contribute to worlddriven | [Contributing](CONTRIBUTING.md) |
| Learn about the automation | [Automation](AUTOMATION.md) |

---

## The Worlddriven Idea

Open source software powers the modern world, yet its governance remains fundamentally undemocratic. Maintainer burnout, ignored contributions, corporate takeovers, and fork wars threaten projects we all depend on.

**Worlddriven solves this through democratic decision-making:**

- **Power Through Participation** - Your first commit gives you a voice. Continued contributions build influence.
- **Time-based Auto-merge** - PRs merge after a configurable period (default: 10 days)
- **Community Voting** - Approvals speed up merges, change requests slow or block them
- **Weighted Votes** - Vote power is proportional to historical contributions
- **No Single Points of Failure** - The community collectively stewards the project

### Learn More

- [Philosophy](PHILOSOPHY.md) - Democratic software development principles
- [Responsibility Model](RESPONSIBILITY.md) - How contributor power and accountability scale
- [Real-World Examples](EXAMPLES.md) - Case studies of governance failures worlddriven prevents

---

## Architecture

Worlddriven consists of three main components:

| Component | Purpose | Repository |
|-----------|---------|------------|
| **Core** | Backend API, voting engine, webhook handling | [worlddriven/core](https://github.com/worlddriven/core) |
| **Webapp** | User interface for managing repositories | [worlddriven/webapp](https://github.com/worlddriven/webapp) |
| **Documentation** | This repo - org governance and docs | [worlddriven/documentation](https://github.com/worlddriven/documentation) |

### GitHub Apps

Worlddriven uses two GitHub Apps following the principle of least privilege:

| App | Purpose | Permissions |
|-----|---------|-------------|
| [WorldDriven](https://github.com/apps/worlddriven) | PR voting and auto-merge | checks, contents, pull_requests, statuses |
| [WorldDriven Migrate](https://github.com/apps/worlddriven-migrate) | Repository transfers | administration |

See [github-apps/](github-apps/) for manifest files and technical details.

### How It Works

```
1. User installs WorldDriven app on their repository
2. PRs trigger webhooks to the Core backend
3. Core calculates voting coefficients based on:
   - Time since PR opened
   - Contributor reviews (approve/request changes)
   - Reviewer's historical contribution weight
4. Status checks show current merge timeline
5. PR auto-merges when coefficient threshold reached
```

For detailed architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Repository Management

This documentation repository serves a special purpose: **it defines and manages all repositories in the worlddriven organization**.

### How It Works

1. **[REPOSITORIES.md](REPOSITORIES.md)** is the source of truth for org repositories
2. Changes to REPOSITORIES.md create PRs that show exactly what will change
3. After democratic review and merge, automation syncs changes to GitHub
4. All infrastructure decisions are transparent, reversible, and community-driven

### What You Can Do

| Action | How |
|--------|-----|
| **Add a repository** | Add entry to REPOSITORIES.md, create PR |
| **Migrate a repository** | Add with `Origin` field, install migrate app |
| **Update settings** | Modify entry in REPOSITORIES.md |
| **Archive a repository** | Set `Archived: true` in entry |

### Automation

The automation enforces:
- Standard configurations (squash-only merges, branch protection)
- Protected critical repositories (documentation, core, webapp)
- Drift detection between desired and actual state

See [AUTOMATION.md](AUTOMATION.md) for the complete automation guide.

---

## Getting Started

### For Users

Visit [www.worlddriven.org](https://www.worlddriven.org) to enable worlddriven for your repositories.

### For Contributors

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to contribute to worlddriven itself.

### For Developers

- [Core repository](https://github.com/worlddriven/core) - Backend implementation
- [Webapp repository](https://github.com/worlddriven/webapp) - Frontend implementation
- [scripts/](scripts/) - Automation scripts reference

---

## The Vision

| Phase | Focus | Status |
|-------|-------|--------|
| **Phase 1** | Democratic PR merging | Current |
| **Phase 2** | Transparent service management | Planned |
| **Phase 3** | Self-governing software ecosystem | Future |

---

## License

AGPL-3.0 - See [LICENSE](LICENSE)
