# SOP: AI Briefing & Context Management Guide V1.0

---

### Purpose

To establish standard procedures for briefing AI agents and managing their context. In the AI-centric paradigm, ambiguity is a direct cause of failure; this guide provides methods for writing executable specifications and managing complex tasks to ensure AI-generated code is robust, secure, and architecturally sound.

---

### 1.0 Writing the Executable Spec

An AI executes instructions with literal precision and cannot reliably infer business context. A request must be rewritten as a detailed specification, transforming the briefer from a "requester" to a "system designer". The following principles are mandatory:

* **Specificity:** Provide granular, algorithmic steps for both frontend and backend tasks instead of high-level goals.
* **Error Handling:** Enumerate every conceivable error state, its corresponding status code, and the exact error message to be returned. An AI cannot infer what "graceful" handling means.
* **Technical Details:** Define function signatures, specific variable names, file paths, and required libraries to remove ambiguity and ensure code conforms to existing architecture.
* **Acceptance Criteria:** Define the exact JSON responses and frontend behaviour for both success and failure states to provide a clear, testable definition of "done".

---

### 2.0 The 10-Point Pre-Flight Checklist

This checklist is a mandatory tool to force the briefer to make the implicit explicit and ensure a request is fully specified before being sent to an AI.

* **Inputs & Outputs:** Have all input parameters and expected output structures been precisely defined with data types?
* **Success Criteria:** Is there at least one concrete example of a successful input and its corresponding, exact output?
* **Error States (The "Unhappy Path"):** Has every conceivable error state been enumerated with its exact required behaviour?
* **Edge Cases & Boundary Conditions:** Have the boundary conditions been explicitly defined (e.g., empty lists, zero/negative numbers)?
* **Dependencies & Environment:** Are all external libraries, API endpoints, and expected file paths clearly listed with versions?
* **State Management:** If the code needs to manage state, is the mechanism clearly defined (e.g., reading a JWT from a header)?
* **Non-Functional Requirements (NFRs):** Are abstract goals translated into measurable requirements (e.g., API response under 50ms)?
* **Code Style & Conventions:** Are there specific instructions on naming conventions or commenting style?
* **Logging & Observability:** What specific information needs to be logged, at what severity level, and in what format?
* **Idempotency:** If an operation could be retried, is the expected behaviour defined to ensure multiple identical requests have the same effect?

---

### 3.0 The Iterative Scaffolding Strategy

For complex, multi-file projects, this multi-prompt process is the standard procedure to avoid failures caused by finite context windows. It transforms the interaction into a stateful "conversation," allowing the team to tackle projects of arbitrary complexity.

* **Prompt 1 (The Blueprint):** Establishes the overall directory structure and generates boilerplate code for all files.
* **Prompt 2 (The Data Model):** Implements a single component (e.g., a database model), referencing the context from Prompt 1.
* **Prompt 3 (The Logic/UI):** Implements the core application logic, referencing context from both previous prompts to ensure correct interaction.

---

### 4.0 Context Engineering for Claude for Code

Actively managing the AI's context window prevents "context dilution" and performance degradation.

* **The Golden Rule:** Start a new chat session using the `/clear` command for each new, logically distinct task. This is the most important rule for maintaining a clean context.
* **Context Hierarchy:** Provide context using the following four-level hierarchy:
    * **Level 1: Foundational Context (CLAUDE.md)**
        This file is the automatically ingested, persistent "single source of truth" for the AI. It provides stable, high-level project information like architectural principles, technology stack, and coding standards, ensuring the AI starts every task with a correct foundational understanding.
    * **Level 2: Task-Specific File Context (File Arguments)**
        This is the primary method for providing codebase context. File paths should be passed as arguments directly to the slash command. This focuses the AI on the exact location for the work. For example: `/dev:implement @path/to/file.py "Implement the function..."`
    * **Level 3: Ad-Hoc Context (Pasting into the Prompt)**
        This method is for providing small snippets of transient information directly within the prompt message. It is ideal for context that does not need to persist, such as error messages, terminal output, or small code snippets for explanation.
    * **Level 4: Conversational Context (Chat History)**
        The immediate chat history provides short-term context for iterative refinement of a single task. This context is volatile and is the primary reason the `/clear` command must be used to manage it effectively between distinct tasks.