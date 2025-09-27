# Worlddriven: Democratic Governance for Open Source

**Worlddriven is democratic governance for open source software. It transforms code contributions into voting power, giving every contributor both the ability and responsibility to steer project direction. By replacing maintainer bottlenecks with community-driven decision making, worlddriven ensures projects remain alive, responsive, and truly collaborative.**

## The Democracy Problem in Open Source

Open source software powers the modern world, yet its governance remains fundamentally undemocratic. This creates critical vulnerabilities that threaten the sustainability and integrity of projects we all depend on.

### Maintainer Bottlenecks
- **58% of maintainers** have abandoned projects or considered doing so due to burnout
- **22% have already left**, with 36% actively considering it
- Over **three-quarters receive no financial compensation** for their work
- Projects die when single maintainers become overwhelmed or move on

### Ignored Contributors
Research reveals a "wasteland of good patches that were completely ignored," where contributors:
- Submit valuable improvements that receive no response
- Ping maintainers multiple times before giving up
- Abandon participation due to systematic neglect
- Face barriers that prevent democratic participation in projects they care about

### Corporate Takeovers
- **MongoDB, Redis, and others** changed licenses to prevent corporate exploitation
- **Docker governance tensions** between project and company interests
- **Foundation vs. company-led models** create ongoing conflicts over control
- License changes effectively privatize community work

### Fork Wars
Famous conflicts that split communities and waste resources:
- **GCC/EGCS split** due to maintainer disagreements (eventually resolved)
- **GNU Emacs/XEmacs** division over project direction
- **BSD fragmentation** into FreeBSD, NetBSD, and OpenBSD
- Personal conflicts creating unnecessary project duplication

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

## Real-World Examples Where Worlddriven Would Help

### Redis Creator's Departure
Salvatore Sanfilippo, Redis founder, stepped down in 2020 saying: "I'm asked more and more to express myself less and to maintain the project more. This is not what I want to do." Worlddriven would have distributed this maintenance burden across the contributor community.

### The Ignored Patch Problem
Many projects show systematic failures where good contributions are ignored, leading to contributor abandonment. Worlddriven's automatic merge system ensures every contribution gets proper consideration and resolution.

### MongoDB License Controversy
When MongoDB changed to SSPL to prevent cloud vendor exploitation, it created uncertainty for users. Worlddriven's democratic process would have allowed the community to collectively decide on license changes based on contributor consensus.

### GCC/EGCS Success Story
The GCC/EGCS fork eventually reunited when it became clear EGCS had better community support. Worlddriven's voting system would have revealed this preference earlier, preventing the fork entirely and focusing energy on collaborative improvement.

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

### From Spectator to Stakeholder
Traditional open source asks you to submit patches and hope they're accepted. Worlddriven makes you an immediate stakeholder with both power and responsibility for project success.

### Prevents Corporate Capture
When the community collectively owns decision-making, no single entity can unilaterally change licenses, direction, or governance. Contributors who built the project retain democratic control.

### Reduces Fork Necessity
Disagreements get resolved through democratic process rather than community fragmentation. Energy focuses on collaborative improvement instead of competing implementations.

### Sustainable Participation
By distributing both power and responsibility, worlddriven creates sustainable participation models that don't depend on individual heroics or burnout-prone maintainership.

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

### The Crisis is Real
Open source faces a sustainability crisis with widespread maintainer burnout, corporate capture of community projects, and a democratic deficit in software that runs the world's infrastructure.

### The Infrastructure Exists
GitHub and GitLab provide the technical foundation. The challenge isn't technical—it's governance. Worlddriven solves the governance problem.

### Community Readiness
Growing awareness of open source governance problems creates demand for solutions. Contributors want meaningful participation, not just code submission privileges.

### Proven Principles
Democratic governance works in other contexts. Worlddriven adapts these principles for software development, creating accountability through transparency and shared ownership.

## Get Started

Visit [www.worlddriven.org](https://www.worlddriven.org) to enable worlddriven for your repositories. Join the growing movement toward democratic, transparent, and sustainable open source governance.

**Ready to take responsibility for the software you help create?**

---

*Learn more about the principles behind worlddriven:*
- [Responsibility Model](RESPONSIBILITY.md) - How contributor power and accountability scale together
- [Real-World Examples](EXAMPLES.md) - Detailed case studies of governance failures worlddriven prevents
- [Philosophy](PHILOSOPHY.md) - Democratic software development principles
- [Vision](VISION.md) - The three-phase roadmap to self-governing software

*Technical implementation details are available in the [core repository](../core/README.md).*