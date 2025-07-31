## SOP: The Grand Unified Workflow
Document ID: ***DWS****-****SOP***-WF-001 Version: 1.0
1.0 Purpose To outline the mandatory, high-level, seven-phase process for taking a project from initial concept to a fully documented final product. This ***SOP*** ensures a consistent and structured approach to development, leveraging a suite of specialist AI agents in a predictable sequence.
2.0 Scope This procedure applies to all new feature development and projects. It defines the end-to-end lifecycle and the key agent interactions at each phase.
3.0 Procedure: The Seven Phases of Development
This system is a seven-phase process designed to take a project from a high-level idea to a fully documented final product. The user's role is that of a
Director, supervising a team of specialist AI agents.
## Phase 1: Navigation
## Agent: /glenn (The Conductor)
Process: The Director states their goal in natural language.
/glenn acts as the master entry point, analysing the goal and providing the exact, ready-to-run specialist command needed to initiate the appropriate workflow phase.
## Phase 2: Project Ignition
## Agent: /brief:create (The DevPilot)
Process: The DevPilot agent conducts a structured interview with the Director to gather the project's goals, features, and technical directives. The outcome is a comprehensive
***CLAUDE****.md file, which serves as the project's **constitution* or master context document.
## Phase 3: Documentation Bootstrap
Agent: /project:bootstrap_docs (Documentation Specialist)
Process: This agent reads the ***CLAUDE****.md file to identify the project's technology stack. It then uses a Model-Context-Protocol (****MCP***) to fetch the latest official documentation for each technology, compiling the results into a
PROJECT_CONTEXT.md file.
## Phase 4: Strategic & Visual Review
Agents: /review:design (Iris) & /review:opportunity (Strategic Analyst)
Process: Before technical planning, the ***CLAUDE****.md brief is submitted to two specialists for parallel review. Iris provides a **Conceptual Design Brief,* while the Strategic Analyst provides a report on unconsidered features and opportunities. This feedback is used to refine the
***CLAUDE***.md file.
## Phase 5: Tactical Planning
## Agent: /plan:create (The Project Plan Architect)
Process: The Architect agent analyses the vetted ***CLAUDE***.md file and deconstructs it into a granular, step-by-step development plan. The outcome is the
task_deps.md file, which serves as the final, executable checklist for the project.
## Phase 6: Supervised Execution
Agent: /workflow:run_automated (The Orchestrator AI)
Process: The Director launches the Orchestrator, which executes the task_deps.md plan one task at a time. After each task, the Orchestrator pauses and presents the results, waiting for the Director's
approve or reject [feedback] command before proceeding. The Orchestrator delegates tasks to specialist **worker** agents like
/dev:implement and /test:generate.
## Phase 7: Final Documentation
## Agent: /document:create (The DocuMentor)
Process: Once the Orchestrator has completed all tasks in the plan, the DocuMentor agent is engaged. It analyses the original
***CLAUDE****.md brief and the final source code to generate a complete ****README***.md file, ensuring the project is properly finished and documented.

