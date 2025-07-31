# SOP: Safe Architectural Refactoring

---

### 1.0 Purpose

The purpose of this Standard Operating Procedure (SOP) is to de-risk high-stakes architectural refactoring. A naive, one-shot command to an AI to refactor a complex system is reckless and can lead to significant issues. This SOP establishes a safer, more deliberate methodology by separating strategic planning from code execution.

The core of this procedure is the **"Plan-and-Critique Loop."** First, the AI is prompted to act as a system architect, creating a detailed, human-readable execution plan without writing any implementation code. This allows for the validation of the overall approach before any changes are made. Second, the AI executes the plan one small step at a time, and after each step, it is prompted to switch roles and critically review its own generated code against predefined architectural principles. This decouples strategy from execution and creates a powerful mechanism for enforcing architectural integrity at scale.

---

### 2.0 Scope

This SOP applies to all developers when undertaking significant architectural refactoring. It is mandatory for high-risk tasks such as decomposing a monolithic application into microservices, or any other change that fundamentally alters the core structure of a system.

---

### 3.0 Procedure

This procedure provides a formal, two-phase workflow for safely executing a major refactoring task using the Plan-and-Critique loop.

#### Phase 1: The Architectural Blueprint (The Plan)

1.  **Define the Goal, Context, and Constraints:** The developer must articulate a clear, high-level objective for the refactoring. This should be accompanied by the relevant source code of the monolithic component and a list of inviolable architectural constraints that the AI must respect.
2.  **Generate the Refactoring Plan:** Using the "Planning Prompt Template," the developer instructs the AI to generate a detailed, step-by-step plan. The output must be a blueprint, not code, that explicitly lists new services, a mapping of functions, a file manifest, and a safe order of operations.
3.  **Review, Iterate, and Finalise the Plan:** The developer must critically review the generated plan for logical fallacies or missed dependencies. The developer can have a dialogue with the AI to refine the plan until it is approved.

#### Phase 2: The Execution & Critique Cycle (Iterate for each step in the plan)

This phase proceeds by executing each step of the finalised plan in a loop.

1.  **Execute a Single, Atomic Step:** The developer gives a clear, concise instruction to the AI, referencing the approved plan (e.g., "Execute Step 3 of our plan...").
2.  **Apply the Critique Prompt:** Immediately after the AI generates the code for the step, the developer follows up with the "Critique Prompt Template." This forces the AI to self-evaluate its work against key principles.
3.  **Implement the Corrected Code:** The AI will provide a bulleted list of critiques and, if issues are found, a revised and improved version of the code. The developer reviews this final output and integrates the validated code.
4.  **Repeat for All Steps:** The developer repeats the cycle for every step in the architectural plan, ensuring each incremental change is built on a foundation of quality and architectural compliance.

---

### 4.0 Master Prompt Templates

These two distinct templates are the core tools for implementing this SOP.

#### Planning Prompt Template