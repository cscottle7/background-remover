# Standard Operating Procedure: UX & Cognitive Principles

| Document ID: | DWS-SOP-DESIGN-003 |
| :--- | :--- |
| **Version:** | 1.0 |
| **Status:** | Final |
| **Approved By:** | Craig Cottle |
| **Date of Issue:** | 28-Jul-2025 |
| **Next Review Date:**| 28-Jul-2026 |

---

### 1.0 Purpose

The purpose of this SOP is to establish a set of core principles and a practical checklist for designing user interfaces that minimize extraneous cognitive load. By adhering to these guidelines, we ensure our products are intuitive, efficient, and respect the finite cognitive resources of our users, allowing them to feel competent and empowered.

### 2.0 Scope

This SOP applies to all design and development agents involved in the creation of user interfaces and user experiences. It should be used as a primary validation tool during the design, review, and refinement stages of any feature.

### 3.0 Core Principles: Managing Mental Effort

Our primary mandate is to manage the user's working memory effectively. To do this, we must understand the three types of cognitive load:

* **Intrinsic Load:** The unavoidable complexity of the task itself. Our goal is to **manage** this load.
* **Extraneous Load:** The unnecessary mental effort imposed by poor design choices (e.g., confusing layouts, inconsistent patterns). Our goal is to ruthlessly **eliminate** this load.
* **Germane Load:** The constructive effort users invest in learning and building a mental model of our system. Our goal is to **foster** this load by creating predictable and consistent systems.

### 4.0 Actionable Design Checklist

This checklist provides a set of rules based on foundational cognitive principles. Use it to validate that your design decisions reduce unnecessary mental strain.

#### 4.1 Principle: Simplify Choices (Hick's Law)
**Goal:** Prevent "decision paralysis" by reducing the number of choices a user must make at any given time.

* **CHECKLIST:**
    * [ ] Does the main navigation prioritize the most common user tasks?
    * [ ] Are secondary or advanced options hidden until explicitly requested (e.g., via an "Advanced Settings" link)?
    * [ ] Have we minimized the number of options in dropdowns, forms, and critical user flows?

#### 4.2 Principle: Structure Information (Miller's Law)
**Goal:** Make complex information easier to process by breaking it down into small, manageable, and related groups ("chunks").

* **CHECKLIST:**
    * [ ] Is long content broken into smaller sections or paragraphs?
    * [ ] Are long forms divided into logical sections or steps (e.g., a "wizard")?
    * [ ] Is related information grouped together visually to form a coherent whole?

#### 4.3 Principle: Make it Obvious (Recognition vs. Recall)
**Goal:** Reduce memory burden by making all objects, actions, and options visible and clearly identifiable.

* **CHECKLIST:**
    * [ ] Are icons always paired with clear, visible text labels?
    * [ ] Is contextual help (e.g., tooltips) provided for any complex or unfamiliar actions?
    * [ ] Does the interface avoid forcing the user to remember information from one screen to the next?

#### 4.4 Principle: Be Predictable (Consistency & Standards)
**Goal:** Lower the learning curve by leveraging established user expectations and maintaining strict internal consistency.

* **CHECKLIST:**
    * [ ] Do our UI patterns align with established external conventions (e.g., Google Material Design, Apple HIG)?
    * [ ] Is the same action (e.g., "Save," "Delete") represented in the exact same way throughout the entire application?
    * [ ] Do different words, situations, or actions always mean the same thing?

#### 4.5 Principle: Apply Key Patterns
**Goal:** Use proven architectural patterns to manage complexity and guide the user.

* **CHECKLIST:**
    * [ ] **Progressive Disclosure:** Is the interface clean and focused by default, with advanced features deferred to a secondary screen or state?
    * [ ] **Task-Oriented Chunking (Wizards):** Are complex, multi-step processes (like setup or configuration) broken into a sequence of smaller, focused screens?
    * [ ] **Clear Visual Hierarchy:** Is it immediately obvious what the most important element on the page is? Is size, color, and contrast used to guide the user's attention to primary information and actions?