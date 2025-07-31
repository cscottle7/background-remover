# SOP: Claude.md Structure and Template V2.1

---

### Purpose

To define the mandatory, standardised structure for the CLAUDE.md project brief file.

---

### Master Template

**Project: {Project Name}**

1.  **The Press Release**
    This section's purpose is to force the team to answer "Why would a customer care?" and create an inspiring "north star" that articulates a clear, aspirational vision from the customer's perspective.

2.  **Customer FAQ**
    This section anticipates and answers questions a real customer would have, serving as a powerful technique to uncover potential usability flaws and value gaps before development begins.

3.  **Internal FAQ**
    This section anticipates hard questions from internal stakeholders about feasibility, resourcing, and strategic fit, proving the project is a viable and well-considered initiative.

4.  **Project Goal & High-Level Requirements**
    This section contains the precise **Jobs-to-be-Done (JTBD)** statement, elevating the goal from a feature description to a compelling, customer-centric mission.

5.  **Core Definitions & Glossary**
    This section prevents the "Shotgun Surgery" anti-pattern by ensuring any term used in more than two requirements is defined in one central place.

6.  **Success Metrics & Measurement Plan**
    This section formally defines how success will be measured, connecting features to tangible business outcomes, creating accountability, and informing prioritisation.

7.  **Core Features & Scope**
    This section is populated by the **User Story Mapping** exercise, which translates the project goal into an unambiguous and prioritised scope of work.
    * **In Scope Stories** in the MVP or first release slice populate this section.
    * **Out of Scope Stories** in future release slices populate this section, making the rationale for deferral clear.

8.  **Tech Stack & Key Libraries**
    This section contains an explicit list of the approved technology stack to prevent the AI from suggesting incompatible libraries or outdated frameworks.

9.  **Architectural Principles & Constraints**
    This is a critical section that defines the non-negotiable architectural rules, data flow patterns, and security principles the AI must follow.

10. **Development Plan (task\_deps.md)**
    This section will be populated later to provide a checklist of decomposed sub-tasks and their dependencies for implementation.