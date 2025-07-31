# Standard Operating Procedure: High-Fidelity Legacy Code Migration

---

**SOP ID:** DWS-SEC-001
**Version:** 1.0
**Author:** Doc Architect
**Date:** 30 June 2025

---

### 1.0 Purpose

The purpose of this Standard Operating Procedure (SOP) is to provide a formal methodology for complex code migrations, such as moving from a legacy framework to a modern one. A simple instruction to an AI to "convert" code is often insufficient because it lacks the necessary context of the target architecture, team-specific coding styles, and idiomatic patterns.

This SOP uses **few-shot prompting**, a technique that involves "teaching" the AI by providing a small number of high-quality examples demonstrating the desired input-to-output transformation. These examples effectively provide micro-lessons on the target architecture, state management, coding style, and dependency usage, transforming a risky translation into a guided, high-fidelity conversion process.

---

### 2.0 Scope

This SOP applies to all developers at Discover Web Solutions who are undertaking complex code migration tasks. This includes, but is not limited to, migrating from a legacy framework to a modern one (e.g., AngularJS to React) or upgrading between major language versions (e.g., Python 2 to Python 3).

---

### 3.0 Procedure

The success of a few-shot migration hinges on the quality and strategic selection of the example "shots." The following five-step procedure outlines a systematic approach to curating a set of examples that will effectively teach the AI the desired migration patterns.

1.  **Identify Core Patterns and Anti-Patterns:** Analyse the legacy codebase to identify the 3-5 most common and representative coding patterns. Simultaneously, identify any common anti-patterns that must be explicitly refactored, not just translated.
2.  **Manually Author High-Quality "Gold Standard" Examples:** For each pattern identified, the developer must manually write the "perfect" translation. This "after" code serves as the ground truth and should exemplify the target architecture, be clean, idiomatic, well-commented, and adhere to all project-specific standards.
3.  **Include Edge Cases and Constraints:** To make the AI more robust, include one or two examples that address common challenges or "gotchas." This teaches the AI how to handle imperfections in the legacy code, such as refactoring inline business logic into a separate helper function.
4.  **Format Consistently with Clear Delimiters:** Structure is key for the AI to understand the examples. Wrap each example and the code within it in clear, consistent delimiters, such as XML-style tags like `<example>`, `<before>`, and `<after>`, to help the model distinguish between instructions, legacy code, and target code.
5.  **Develop a Chunking Strategy for Large Files:** Since LLMs have a finite context window, do not feed an entire large file at once. Adopt a hierarchical approach by migrating parent or container components first. For subsequent prompts, include the newly migrated parent component as part of the context when asking the AI to migrate a child component.

---

### 4.0 Master Prompt Template

This template provides a robust, reusable structure for any code migration task. It clearly separates the instructional context, the examples, and the new task.