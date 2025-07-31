# Project Briefing Best Practices

---

### Purpose

To establish a standardised set of principles for creating clear, comprehensive, and actionable project briefs. This document ensures that every project begins with a shared understanding of the problem, a measurable definition of success, and a clear scope.

---

### Core Principles

**Principle 1: Define the Problem Before the Solution**
The project's goal must be framed as a customer-centric mission, not a feature description. To achieve this, the official method is the **Jobs-to-be-Done (JTBD) framework**. This involves conducting interviews to understand the "struggling moment" that led a customer to seek a new solution.

**Principle 2: Define Success Quantitatively**
Every requirement must be verifiable and tied to a measurable outcome. Before finalising, the briefer must answer: "What specific, measurable test would prove this requirement has been met?".

**Principle 3: Establish Unambiguous Scope**
To translate a high-level goal into a prioritised scope, the official method is **User Story Mapping**. This is a collaborative workshop to visually map the user's journey, consisting of a chronological "Backbone" of user activities and a "Body" of prioritised user stories, which are then grouped into release slices.

**Principle 4: State All Assumptions**
All assumptions, especially those related to business context, user behaviour, or technical dependencies, must be documented.

**Principle 5: Identify Constraints and Directives**
Technical constraints, deadlines, budget limitations, and other directives must be explicitly listed.

---

### Briefing Anti-Patterns & Preventative Checks

An anti-pattern is a common practice that appears to be a good solution but reliably leads to negative consequences. The following checks are a mandatory review step before a brief is finalised.

**The God Brief**
*Description:* A single, massive brief for a multi-quarter initiative that is too big to comprehend or update.
*Preventative SOP Check:* Any brief estimated to exceed a set workload (e.g., 6 sprint-weeks) MUST be broken down into smaller epics, each with its own brief.

**The Lava Flow Brief**
*Description:* A brief created by copying an old one, containing irrelevant legacy requirements and outdated assumptions.
*Preventative SOP Check:* Every brief MUST have a 'Last Reviewed' date and an 'Owner.' Briefs must be re-validated if not started within a set time (e.g., 30 days).

**The Magic Number Brief**
*Description:* The brief contains hardcoded, unexplained values (e.g., "timeout is 30 seconds") without explaining the "why" behind them.
*Preventative SOP Check:* Any hardcoded value in a requirement MUST be accompanied by a comment explaining its origin and purpose.

**The Shotgun Surgery Brief**
*Description:* A core concept (e.g., "Active User") is not defined centrally, requiring manual edits in dozens of scattered places across the document.
*Preventative SOP Check:* The brief MUST include a Core Definitions & Glossary section. Any term used in more than two requirements must be defined there.

**The Ambiguity-as-a-Feature Brief**
*Description:* The brief uses vague language like "improve user experience" or "handle errors gracefully," delegating critical decisions to the developer.
*Preventative SOP Check:* Every requirement must be verifiable. The briefer must answer: "What specific, measurable test would prove this requirement has been met?".