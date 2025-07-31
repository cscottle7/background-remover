# SOP: Systematic Debugging with Chain-of-Thought (CoT)

---

### 1.0 Purpose

The purpose of this Standard Operating Procedure (SOP) is to move beyond simple "black box" fixes for software bugs. Instead of asking an AI to just "fix the code," this procedure uses **Chain-of-Thought (CoT) prompting** to guide the AI through a human-like analytical process. The goal is to make the AI expose its underlying logic, articulating its analysis, hypotheses, and testing plans before offering a solution. This creates a transparent and auditable debugging process, ensuring that the final fix is based on a sound, well-understood diagnosis and that the developer retains full intellectual control.

---

### 2.0 Scope

This SOP applies to all developers when diagnosing complex, non-trivial bugs, such as race conditions, subtle logic errors, or issues arising from interactions between multiple system components.

---

### 3.0 Procedure

Applying Chain-of-Thought prompting effectively requires a structured protocol to ensure high-quality information is provided to the AI and its output is rigorously scrutinised.

1.  **Isolate and Document Symptoms:** Before engaging the AI, the developer must perform thorough preliminary analysis and document the bug precisely. This documentation should include the exact error message and stack trace, relevant logs, a description of the incorrect behaviour vs. the expected behaviour, and a minimal, reproducible code snippet that triggers the bug.
2.  **Formulate the Structured CoT Prompt:** Use the master template to construct a detailed prompt, populating it with the information gathered in Step 1. The prompt must explicitly instruct the AI to follow the structured reasoning format (Analysis, Hypothesis, Test Plan) and to wait for approval before providing a code fix.
3.  **Critically Evaluate the AI's Reasoning Chain:** This is the most critical step. The developer must rigorously review the AI's `<thinking>` block. The developer should assess if the AI's symptom analysis is correct, if its hypotheses are logical, and if the proposed test plan is sound. Proceed only after being confident in the AI's logic. If the reasoning is flawed, provide feedback and ask the AI to refine its analysis.
4.  **Implement and Verify the Proposed Fix:** Only after the reasoning chain has been validated should the developer request the code fix. Once the AI provides the code within the `<fix>` tags, the developer must carefully review the changes, apply them, run the original failing test case to confirm the fix, and execute the broader test suite to check for regressions.

---

### 4.0 Master Prompt Template

This template constrains the AI's output into a predictable, structured, and auditable format, using XML tags to separate reasoning from implementation.