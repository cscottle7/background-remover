# SOP: Strategic Brief Review

**Document ID:** DWS-SOP-PM-003
**Version:** 1.2
**Status:** Final
**Author:** Doc Architect
**Date of Issue:** 18-Jul-2025

## 1.0 Purpose
The purpose of this Standard Operating Procedure (SOP) is to establish a mandatory quality gate that all new **project planning documents (whether a `prd.md` or a `CLAUDE.md` brief)** must pass before entering the development planning phase. This process ensures every plan is rigorously "pressure-tested" for conceptual flaws, potential user experience (UX) issues, and strategic alignment, thereby mitigating risks.

## 2.0 Scope
This SOP applies to all developers and project leads at Discover Web Solutions responsible for the creation of a **planning document** for a new project or a significant feature initiative. It governs the mandatory review and refinement cycle that begins after the first draft of a planning document is complete.

## 3.0 Roles & Responsibilities

* **Developer / Project Lead (Author):**
    * Responsible for authoring the first draft of the **planning document**.
    * Responsible for initiating this review procedure using the specified tool.
    * Responsible for analysing the feedback report and creating a refined final version.
* **Critique Companion (`/review:brief` command):**
    * The designated AI tool responsible for executing the multi-persona strategic analysis.
    * Responsible for generating the consolidated feedback report.

## 4.0 Procedure

1.  **Initiation:** The procedure commences once the first draft of the project's **planning document (`prd.md` or `CLAUDE.md`)** is considered complete by the author.
2.  **Engagement:** The author must engage the `Critique Companion` specialist by running the `/review:brief` command.
3.  **Request for Analysis:** The author will submit the draft **planning document** to the specialist and explicitly request a "Full Strategic Review".
4.  **Multi-Persona Synthesis:** This review must synthesize feedback from the following four mandatory personas to ensure a holistic analysis:
    * The Cognitive Miser
    * The Task-Driven Problem Solver
    * The Devil's Advocate
    * The 'What Could Go Wrong?' Pessimist
5.  **Receive Consolidated Feedback:** The author will receive a single, consolidated feedback report from the specialist, combining the analysis from all four personas.
6.  **Refinement and Finalisation:** The author must use the feedback report to address any identified weaknesses. The output of this step is a refined and approved planning document, ready for the subsequent planning phase.