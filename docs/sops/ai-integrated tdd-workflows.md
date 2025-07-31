# Standard Operating Procedure: AI-Integrated Test-Driven Development (TDD) Workflows

---

**SOP ID:** DWS-DEV-005
**Version:** 1.0
**Author:** Doc Architect
**Date:** 29 June 2025

---

### 1.0 Purpose

To standardise the use of Test-Driven Development (TDD) in an AI-assisted context. This SOP outlines three distinct, actionable workflow models for new feature development, legacy code refactoring, and bug fixing, ensuring a robust and verifiable implementation process.

---

### 2.0 Scope

This procedure applies to all development projects where AI assistants are used to generate or refactor code that impacts application logic. It is the mandatory framework for ensuring AI-generated code is verifiable and correct.

---

### 3.0 Roles and Responsibilities

* **Developer:** Responsible for writing the initial failing tests, crafting the prompts for the AI, verifying that the AI-generated code passes the tests, and initiating the refactoring step.
* **AI Assistant:** Responsible for generating code to pass tests and suggesting refactoring improvements based on developer prompts.
* **Tech Lead:** Responsible for reviewing the final, tested, and refactored code during pull requests.

---

### 4.0 Prerequisites

* A correctly configured testing framework (e.g., Jest, PyTest) must be in place for the project.
* The developer must have a clear requirement or bug description to translate into a failing test.

---

### 5.0 The Symbiotic Relationship between TDD and AI

**Test-Driven Development (TDD)** is a software development process that relies on the repetition of a very short development cycle: first, the developer writes an (initially failing) automated test case that defines a desired improvement or new function, then produces the minimum amount of code to pass that test, and finally refactors the new code to acceptable standards. In an AI-native environment, this methodology proves to be more than just a best practice for quality; it becomes a foundational framework for effective human-AI collaboration.

The TDD cycle provides the ideal "guardrails" for AI-powered code generation. The tests, written by the developer, serve as an unambiguous, machine-verifiable specification of correctness. This addresses one of the primary weaknesses of LLMs: their tendency to produce plausible-looking but subtly incorrect code. The AI excels at rapidly generating code to satisfy a given constraint, making it perfectly suited to accelerate the "Green" (write code to pass the test) and "Refactor" stages of the TDD loop. The human developer retains the critical role of defining the requirements (the "Red" stage) and verifying the final output.

---

### 6.0 Overview of TDD Models

While the core principle of TDD is universal, its application varies depending on the development context. A solo developer faces different challenges when creating a new feature, modifying legacy code, or hunting down a specific bug. The following three models provide tailored, step-by-step workflows for these common scenarios, integrating AI capabilities at each stage.

| Model Name       | Objective                                                                                   | Key Prompt Sequence                                                    |
| :--------------- | :------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------- |
| **The Greenfield** | To build a new feature from scratch, ensuring test coverage from the very first line of code. | 1. Human writes failing test. 2. AI prompted to write minimal code to pass. 3. AI prompted to refactor passing code. |
| **The Legacy Refactor** | To safely modify or refactor existing, untested code by first creating a test-based safety net. | 1. AI prompted to generate "characterisation tests" for existing code. 2. Human verifies tests. 3. AI prompted to refactor code, using the new tests as guardrails. |
| **The Bug Hunt** | To methodically reproduce a known bug with a failing test and then use that test to verify the fix. | 1. AI prompted to write a single, failing test that reproduces a specific bug. 2. Human verifies the test fails correctly. 3. AI prompted to modify the source code to make the test pass. |

---

### 7.0 Model 1: "The Greenfield" (New Feature from Scratch)

This model is the classic TDD workflow, augmented by AI to accelerate implementation. It is ideal for building new functionality within a project.

**Step 1 (Red): Write a Failing Test.** The developer begins by manually creating a new test file and writing a single, specific, and currently failing test for the first piece of functionality. For instance:

```typescript
import { findUserById } from '@/services/UserService';
describe('UserService', () => {
  it('should return a user object for a valid ID', () => {
    const user = findUserById(1);
    expect(user).toBeDefined();
    expect(user.id).toBe(1);
  });
});