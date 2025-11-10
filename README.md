# Worlddriven: Democratic Governance for Open Source

**Worlddriven is democratic governance for open source software. It transforms code contributions into voting power, giving every contributor both the ability and responsibility to steer project direction. By replacing maintainer bottlenecks with community-driven decision making, worlddriven ensures projects remain alive, responsive, and truly collaborative.**

## The Democracy Problem in Open Source

Open source software powers the modern world, yet its governance remains fundamentally undemocratic. This creates critical vulnerabilities that threaten the sustainability and integrity of projects we all depend on.

### Maintainer Bottlenecks
- **58% of maintainers** have abandoned or considered abandoning projects due to burnout
- Over **three-quarters receive no compensation** while projects die when they become overwhelmed

### Ignored Contributors
Research reveals a "wasteland of good patches that were completely ignored"—valuable improvements receive no response, leading contributors to abandon participation and creating barriers to democratic involvement.

### Corporate Takeovers
Projects like **MongoDB and Redis** changed licenses to prevent exploitation, creating **governance tensions** between community interests and corporate control. License changes can effectively privatize community work.

### Fork Wars
Famous conflicts like **GCC/EGCS**, **Emacs/XEmacs**, and **BSD fragmentation** split communities and waste resources due to maintainer disagreements over project direction.

## What is Worlddriven?

Worlddriven revolutionizes open source governance by implementing democratic decision-making that scales with contribution.

### Power Through Participation
Your first commit gives you a voice in the project's future. Continued contributions build your influence, creating a direct democracy where those who do the work make the decisions.

### Shared Responsibility
Contributors don't just submit code—they become stewards of the project's future. With voting power comes accountability for the project's direction, quality, and community health.

### Time-based Auto-merge
Pull requests automatically merge after a configurable time period (default: 10 days), but community votes can accelerate or block merges:
- **Positive reviews** from contributors reduce merge time
- **Change requests** increase merge time or block merging entirely
- **Vote weight** is proportional to the reviewer's historical contributions
- **Transparent calculations** show exactly how decisions are made

### Eliminates Single Points of Failure
No more projects dying because one maintainer burns out. The community collectively shoulders both the burden and benefits of project stewardship.

## Organization Management

This repository practices what it preaches: **the worlddriven organization itself is managed democratically through pull requests**. Infrastructure decisions follow the same democratic process as code.

### How It Works
- **[REPOSITORIES.md](REPOSITORIES.md)** defines all repositories in our organization
- Proposed changes create pull requests that show exactly what will change
- After democratic review and merge, automation applies changes to GitHub
- All infrastructure decisions are transparent, reversible, and community-driven

### Democratic Infrastructure
Our automation enforces:
- Standard configurations for democratic governance (squash-only merges, branch protection)
- Protected critical repositories (documentation, core, webapp)
- Transparent sync reports showing all changes

**Learn more**: [AUTOMATION.md](AUTOMATION.md) - Complete guide to our infrastructure automation

**Current repositories**: [View on GitHub](https://github.com/orgs/worlddriven/repositories)

## Real-World Examples Where Worlddriven Would Help

**Redis Creator's Departure**: Salvatore Sanfilippo stepped down in 2020, saying "I'm asked more and more to maintain the project more. This is not what I want to do." Worlddriven distributes maintenance burden across the contributor community.

**Ignored Patches**: Many projects systematically ignore good contributions, leading to contributor abandonment. Worlddriven's automatic merge system ensures every contribution gets proper consideration.

**MongoDB License Change**: When MongoDB changed to SSPL to prevent cloud vendor exploitation, it created uncertainty. Worlddriven's democratic process would let the community collectively decide license changes.

**GCC/EGCS Fork**: This split eventually reunited when EGCS had better community support. Worlddriven's voting would have revealed this preference earlier, preventing the fork entirely.

## The Responsibility Model

### Entry Level: First Contribution = First Vote = First Responsibility
Making your first commit immediately grants voting rights and begins your stewardship role in the project's future. You're no longer just a user—you're an owner.

### Growing Influence: More Contributions = Greater Stewardship
Your voting power scales with your investment in the project. Long-term contributors naturally gain more influence, but newcomers can quickly earn significant voice through quality contributions.

### Collective Ownership
Everyone who contributes owns and is responsible for the outcome. This creates a culture of investment rather than extraction, where contributors think long-term because they control the project's destiny.

### Democratic Leadership, Not Dictatorship
Veteran contributors become democratic leaders who guide through influence and example, not absolute authority. Their expertise carries weight, but the community makes collective decisions.

## How Worlddriven Changes the Game

**From Spectator to Stakeholder**: Your first contribution makes you an immediate stakeholder with both power and responsibility for project success.

**Prevents Corporate Capture**: Collective decision-making means no single entity can unilaterally change licenses, direction, or governance.

**Reduces Fork Necessity**: Disagreements resolve through democratic process rather than community fragmentation, focusing energy on collaborative improvement.

**Sustainable Participation**: Distributing power and responsibility creates sustainable models that don't depend on individual heroics or burnout-prone maintainership.

## The Vision: Three Phases

### Phase 1 (Current): Democratic Pull Request Merging
- Solves immediate maintainer bottleneck problems
- Proves democratic governance concept works at scale
- Establishes contributor responsibility culture
- Currently deployed at [www.worlddriven.org](https://www.worlddriven.org)

### Phase 2: Transparent Service Management
- Entire services managed via pull requests
- Infrastructure as Code meets democracy
- Community-driven operational decisions with shared accountability
- Server configurations, deployments, and policies decided collectively

### Phase 3: Self-Governing Software Ecosystem
- Minimal human intervention required
- Fully automated, transparent infrastructure
- True digital democracy where contributors collectively own all outcomes
- Software that governs itself through democratic contributor consensus

## Why Now?

**The Crisis is Real**: Open source faces widespread maintainer burnout, corporate capture, and a democratic deficit in software running the world's infrastructure.

**The Infrastructure Exists**: GitHub and GitLab provide the technical foundation. The challenge is governance—which worlddriven solves.

**Community Readiness**: Growing awareness of governance problems creates demand for solutions. Contributors want meaningful participation, not just code submission privileges.

**Proven Principles**: Democratic governance works in other contexts. Worlddriven adapts these principles for software, creating accountability through transparency and shared ownership.

## Get Started

Visit [www.worlddriven.org](https://www.worlddriven.org) to enable worlddriven for your repositories. Join the growing movement toward democratic, transparent, and sustainable open source governance.

**Ready to take responsibility for the software you help create?**

---

*Learn more about the principles behind worlddriven:*
- [Responsibility Model](RESPONSIBILITY.md) - How contributor power and accountability scale together
- [Real-World Examples](EXAMPLES.md) - Detailed case studies of governance failures worlddriven prevents
- [Philosophy](PHILOSOPHY.md) - Democratic software development principles
- [Automation](AUTOMATION.md) - How this organization manages itself democratically

*Technical implementation details are available in the [core repository](../core/README.md).*