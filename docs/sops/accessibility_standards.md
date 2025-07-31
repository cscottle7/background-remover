# Standard Operating Procedure: Accessibility Standards (WCAG)

| Document ID: | DWS-SOP-DESIGN-004 |
| :--- | :--- |
| **Version:** | 1.0 |
| **Status:** | Final |
| **Approved By:** | Craig Cottle |
| **Date of Issue:** | 28-Jul-2025 |
| **Next Review Date:**| 28-Jul-2026 |

---

### 1.0 Purpose

The purpose of this document is to define the mandatory accessibility standards for all products at Discover Web Solutions. It is a practical guide for our team, based on the four foundational principles of the Web Content Accessibility Guidelines (WCAG). Adherence to this SOP ensures our products are inclusive by design.

### 2.0 Scope

This SOP applies to all design, development, and quality assurance agents. It serves as an actionable checklist to validate that all work meets our commitment to accessibility.

### 3.0 The Four Principles of Accessibility (POUR)

All user-facing content and components must adhere to the following four principles.

#### 3.1 Perceivable
*Users must be able to perceive the information being presented.*

* **Requirements Checklist:**
    * [ ] Provide text alternatives (alt text) for all non-text content.
    * [ ] Provide captions for all video/audio content.
    * [ ] Ensure colour is not used as the sole means of conveying information.
    * [ ] Ensure text has a sufficient colour contrast ratio (minimum 4.5:1 for normal text).

#### 3.2 Operable
*Users must be able to operate the interface.*

* **Requirements Checklist:**
    * [ ] All functionality must be available from a keyboard.
    * [ ] Provide clear and visible focus indicators for keyboard navigation.
    * [ ] Users must have controls to pause, stop, or hide any moving or auto-playing content.
    * [ ] Touch targets must be sufficiently large for mobile users.

#### 3.3 Understandable
*Users must be able to understand the information as well as the operation of the user interface.*

* **Requirements Checklist:**
    * [ ] Use clear and simple language.
    * [ ] Navigation and component behaviour must be consistent and predictable across the application.
    * [ ] Provide helpful error messages that suggest a solution when a user makes a mistake.

#### 3.4 Robust
*Content must be robust enough that it can be interpreted reliably by a wide variety of user agents, including assistive technologies.*

* **Requirements Checklist:**
    * [ ] Use valid, semantic HTML to correctly structure content (e.g., using `<nav>`, `<h1>`, `<button>`).
    * [ ] Use ARIA attributes where necessary to enhance the semantics of custom components for screen readers.