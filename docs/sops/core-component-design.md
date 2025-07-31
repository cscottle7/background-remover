# Standard Operating Procedure: Core Component Design System & Style Guide

---

**SOP ID:** DWS-UIUX-002
**Version:** 1.0
**Author:** Craig Cottle
**Date:** 30 June 2025

---

### 1.0 Purpose

To establish a foundational design system for Discover Web Solutions by identifying the most critical SaaS UI components and defining their best-in-class design patterns, accessibility guidelines, and React implementation specifications.

---

### 2.0 Scope

This SOP applies to all new UI/UX design and frontend development at Discover Web Solutions. It serves as the primary style guide and technical reference for creating all user-facing components.

---

### 3.0 Roles and Responsibilities

* **UI/UX Designer:** Responsible for using this guide to create consistent and accessible design mockups.
* **Frontend Developer:** Responsible for implementing React components that strictly adhere to the technical specifications and visual principles defined in this guide.
* **Tech Lead:** Responsible for governing the evolution of this design system and ensuring its consistent application across projects.

---

### 4.0 Foundational SaaS UI Components

#### 4.1 Methodology for Component Identification

Identifying the most essential UI components for a foundational SaaS application requires a comprehensive approach that combines empirical evidence from real-world usage with established best practices from leading design systems.

The identification process involved a multi-pronged analysis:

* **Design System Cross-referencing:** Components that consistently appear across multiple prominent design systems, such as Material Design (Google), Ant Design, Carbon Design System (IBM), Atlassian Design System, and Salesforce Lightning Design System, are strong indicators of fundamental utility and widespread adoption in enterprise-grade applications.
* **Mobbin Analysis:** Mobbin, a vast repository of real-world design inspiration, offers insights into actual UI component prevalence through its "Web UI Elements" and "Dashboard" collections. By focusing on components with high screen counts, it is possible to gauge their practical importance and recurring nature in modern SaaS dashboards and core application views.
* **Strategic Categorisation:** The identified components were further prioritised based on their primary function within a SaaS context: facilitating data display, enabling user input, supporting efficient navigation, and providing crucial feedback.

#### 4.2 Top 20 Essential SaaS UI Components

Based on the synthesis of these data sources, the following table provides a definitive, data-backed list of components, serving as a foundational reference for any SaaS application's design system.

| Component Name                 | Primary Purpose           | Rationale for Criticality in SaaS Context                                                 | Mobbin Screen Count           | Presence in Major Design Systems (Material, Ant, Carbon, Atlassian, Salesforce) |
| :----------------------------- | :------------------------ | :---------------------------------------------------------------------------------------- | :---------------------------- | :-------------------------------------------------------------------------------- |
| **Button** | Action                    | Fundamental for all user interaction, initiating actions and navigation.                  | 8786                          | Yes                                                                               |
| **Text Input / Text Field** | User Input                | Primary means for users to provide data, search queries, or content.                      | 5407                          | Yes                                                                               |
| **Select / Dropdown / Combobox** | User Input                | Efficiently handles choices from predefined lists, saving screen real estate.             | 1691 (Select), 650 (Combobox) | Yes                                                                               |
| **Checkbox** | User Input                | Enables flexible multi-selection or binary toggles.                                       | 857                           | Yes                                                                               |
| **Radio Button** | User Input                | Ensures mutually exclusive choices, critical for clear decision-making.                   | 754                           | Yes                                                                               |
| **Table / Data Table** | Data Display              | Essential for displaying and managing large, structured datasets in a scannable format.   | 1159                          | Yes                                                                               |
| **Card** | Data Display / Containment | Versatile for organising information, often used in dashboards to present key metrics or summaries. | 3305                          | Yes                                                                               |
| **Modal / Dialog** | Feedback / Action         | Captures user attention for critical information, confirmations, or focused tasks without navigating away. | 3160                          | Yes                                                                               |
| **Tabs** | Navigation / Content Organisation | Efficiently segments content, reducing cognitive load and simplifying navigation within a single view. | 2150                          | Yes                                                                               |
| **Navigation Menu (Side/Top)** | Navigation                | Provides primary pathways through the application, defining information architecture.     | 1544 (Side), 1176 (Top)       | Yes                                                                               |
| **Breadcrumbs** | Navigation                | Enhances user orientation in complex, multi-level SaaS applications.                      | 651                           | Yes                                                                               |
| **Loading Indicator / Spinner / Progress Bar** | Feedback                  | Crucial for managing user expectations during asynchronous operations, reducing perceived latency. | 1127 (Loading), 1440 (Progress) | Yes                                                                               |
| **Toasts / Snackbars** | Feedback                  | Provide ephemeral feedback without blocking user interaction.                             | 930 (Toast)                   | Material, Ant, Atlassian                                                          |
| **Tooltips** | Feedback / Information    | Offer contextual help or additional information without permanent screen clutter.         | 1165                          | Yes                                                                               |
| **Icons** | Visual Cue                | Conveys meaning concisely, saving space and aiding quick recognition.                     | 2600                          | Yes                                                                               |
| **Search Bar** | User Input / Navigation   | Enables quick access to specific information, a cornerstone of efficiency in data-rich SaaS. | 1544                          | Material, Carbon, Atlassian                                                       |
| **Pagination** | Data Display / Navigation | Manages the display of large datasets, improving performance and user comprehension.      | 619                           | Ant, Carbon, Atlassian                                                            |
| **Alerts / Banners** | Feedback                  | Communicate important, non-critical information that requires user awareness but not immediate blocking action. | 2220 (Banner)                 | Ant, Atlassian                                                                    |
| **Badge** | Feedback / Status         | Provides glanceable feedback on new activity or status without interrupting workflow.     | 1972                          | Material, Ant, Atlassian, Salesforce                                              |
| **Date Picker** | User Input                | Standardises date input, improving accuracy and user experience for time-sensitive data.  | 467                           | Material, Ant, Carbon, Atlassian                                                  |

---

### 5.0 Best-in-Class Design Patterns

#### 5.1 Inputs & Actions

This section details design patterns for core interactive components, focusing on visual presentation, interaction design, and accessibility.

| Component Name               | Key Design Patterns                                                         | UX/Accessibility Strengths                                                                                                                                              | Examples of Micro-interactions                                        |
| :--------------------------- | :-------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------- |
| **Buttons** | Variants (Text, Contained, Outlined, Filled, Gradient), Clear Action Labels, Disabled States, Error/Success States. | WCAG 2.2 (Perceivable, Operable, Understandable), 4.5:1 text contrast, 3:1 button contrast, 24x24px (44x44px mobile) touch target, Keyboard navigable, ARIA-labelled icons. | Colour change on hover/focus, Subtle bounce/ripple on click, Loading spinner, Confirmation checkmark/confetti. |
| **Text Inputs** | Persistent Labels, Helper Text, Placeholder Text, Inline Validation, Autofill. | Explicit label association (`<label>`, `aria-label`), `aria-required`, `aria-multiline`, Logical tab order, Clear focus indicators, Screen reader announcements. | Real-time validation (green/red borders), Password strength indicators, Character count, Small loading/saving spinner. |
| **Select/Dropdowns** | Clear Labels, Editable/Filterable Options, Grayed-out unavailable options.    | Keyboard navigable (arrow keys, Enter/Space), Semantic HTML (`<select>`), ARIA roles (listbox), Screen reader compatible.                                            | Highlight selected option, Checkmark for selection, Real-time filtering as user types. |
| **Checkboxes/Radio Buttons** | Clear Labels (clickable), Vertical Stacking, Logical Order, Indeterminate State (Checkbox). | High contrast, Keyboard navigable (Space key), 44x44px mobile touch target, Label-to-control association (inputId, aria-labelledby).                                  | Smooth animations on selection, Colour transitions, Contextual tooltips on hover/click. |

#### 5.2 Data Display & Navigation

This section analyses patterns for more complex components, focusing on effective content organisation and strategies for handling large datasets.

| Component Name             | Effective Content Organisation Strategies                                                                                                                                       | Strategies for Handling Large Datasets or Complex Options                                                                                                                                                                                                                                                                                                                                   | Accessibility Guidelines                                                                                                                                                                      |
| :------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tables** | Clear, descriptive headers (`<th>`, `scope`), Programmatic captions (`<caption>`, `aria-label`), Right-align numeric columns, Avoid layout tables.                                | Search functionality (auto-suggestions), Advanced filtering (multi-select, dynamic combinations, real-time), Sorting, Pagination/Infinite scroll/Virtualisation, Frozen headers/columns, Row density controls, Bulk actions, Inline editing. | Semantic HTML (`<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>`), Full keyboard operability, Correct screen reader announcements (headers, captions, data cells). |
| **Modals/Dialogs** | Concise content (bullet points), Clear title (`aria-labelledby`), Descriptive text (`aria-describedby`), Action-oriented button labels, Visual cues (icons, top borders).         | Single, focused purpose (confirmation, alerts, forms, upsells, announcements).                                                                                                                                                                                                                                                                                                              | ARIA roles (dialog, alertdialog), `aria-modal="true"`, Proper focus management (on open, trap, on close), Keyboard operability (Tab, Shift+Tab, Escape), Screen reader announcements of role/name/description, Dimming overlay. |
| **Tabs** | Group related content, Clear/concise labels (1-2 words), High visual weight for active tab, Avoid for comparison/linear processes.                                            | Variants (Horizontal, Vertical, Icon-only, Segmented, Scrollable, Dynamic), Nested tabs (up to 3 levels), Overflow handling with scrollable tabs/arrows.                                                                                                                                                                                                                                      | ARIA roles (tablist, tab, tabpanel), `aria-labelledby`, `aria-haspopup`, Keyboard operability (Tab, Arrows, Space/Enter), Automatic vs. Manual activation, Tooltips for icon-only tabs. |
| **Navigation Menus (Side/Top)** | Consistent structure, Clear/concise labels & intuitive icons, Logical categorisation, Simplified hierarchies, Visual cues for status.                                     | Horizontal vs. Vertical menus, Mega menus (for large sites), Hamburger menus (mobile), Sticky navigation, Nested menus.                                                                                                                                                                                                                                                                     | Skip-to-content links, Semantic HTML (`<nav>`, `<ul>`, `<li>`), ARIA attributes (role="navigation", `aria-label`, `aria-expanded`), Full keyboard operability, Clear focus indicators, Screen reader announcements, `display: none;` for hidden mobile content. |
| **Breadcrumbs** | Origin, Levels, Delineator, Current (unlinked), Prominent/consistent placement, Concise labels.                                                                                 | Location/Hierarchy-based, Path/History-based, Attribute-based, Application breadcrumbs.                                                                                                                                                                                                                                                                                                     | Semantic structure (list of links), Keyboard operability, Screen reader announcements, Secondary navigation (not primary replacement), Visual distinctiveness. |

---

### 6.0 UI/UX Excellence Principles

The strategic principles of UI/UX excellence are actionable guidelines that must manifest concretely in every component of a SaaS application.

| Principle       | Definition                                                                                                                              | Component Examples                                     | Actionable Design/Implementation Guidelines                                                                                                                                                                                                                                                                             |
| :-------------- | :-------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Clarity** | Users understand what they see and what actions they can take without guessing; interface communicates efficiently.                       | Text Input, Button, Navigation Menu, Modal, Table      | Use clear labels and helper text for input fields. Employ unambiguous action labels for buttons. Ensure navigation menus have descriptive, concise labels. Keep modal content concise and titles clear. Provide meaningful table headers and captions.                                                                     |
| **Consistency** | Uniform design patterns, visual styles, and interaction behaviors across the interface, building confidence and reducing cognitive load.    | Buttons, Input Fields, Navigation, Iconography, Typography, Error Handling | Maintain consistent styling for all button variants. Ensure uniformity in input field appearance and validation feedback. Standardise navigation placement and behaviour. Develop a consistent style for all icons. Apply consistent typography rules.                                                                     |
| **Feedback** | System's timely response to user actions, confirming operations or alerting to errors, minimising confusion and building trust.           | Buttons, Forms/Inputs, Progress Indicators, Toasts/Snackbars | Implement visual changes (colour/size) on button hover/click. Display loading spinners for ongoing button actions. Provide inline validation with real-time visual cues for forms. Use clear error messages with instructions. Utilise progress bars for multi-step tasks.                                                   |
| **Usability** | Products are easy to navigate, efficient to use, and free of unnecessary friction, allowing users to complete tasks effectively.          | Navigation, Forms, Tables, General UI                  | Design intuitive navigation menus and clear pathways. Minimise required user input in forms and leverage autofill. Incorporate interactive features (sorting, filtering, pagination) in tables. Provide "undo" options or "emergency exits". Match system to user mental models.                                          |
| **Accessibility** | Product can be used by everyone, including individuals with disabilities, ensuring universal usability and inclusivity.                   | All Components                                         | Adhere to WCAG compliance (4.5:1 text contrast, 3:1 non-text contrast). Ensure full keyboard navigation for all interactive elements. Provide descriptive alt attributes for images. Use ARIA attributes (`aria-label`, `role`) for context. Ensure touch target size is adequate (24x24px / 44x44px mobile).        |
| **Simplicity** | Reducing complexity, removing unnecessary elements, and focusing on core value to make the interface intuitive and distraction-free.      | General Interface, Forms, Navigation                   | Minimise elements; each component serves a clear function. Ask only for essential information in forms. Limit options in navigation menus. Employ clean layouts and ample white space.                                                                                                                              |
| **Visual Hierarchy** | Guiding user's eyes through interface by strategically using size, colour, spacing, and position to indicate importance and relationships. | Typography, Colour, Spacing, Grouping (Cards, Panels)  | Use larger/bolder fonts for headings. Employ contrasting colours to highlight CTAs. Increase spacing between unrelated sections, reduce for related. Group related elements using proximity or common regions (e.g., cards).                                                                                          |
| **Flexibility** | Allowing for adaptability and customisation according to unique user requirements, enhancing satisfaction and inclusivity.                | Dashboards, Themes, Navigation, Components             | Implement personalisation features (customisable dashboards, themes). Ensure responsive design across various screen sizes and devices. Offer multiple ways to complete tasks. Design components with configurable props for customisation.                                                                    |
| **Scalability** | Ability of design system and application to accommodate future growth, new features, and increasing complexity without compromise.        | All Components, Design System Infrastructure           | Build reusable components. Adopt Atomic Design methodology. Utilise design tokens for consistent styling. Establish standardised naming conventions. Maintain clear documentation and version control. Prioritise performance optimisation.                                                                |

---

### 7.0 React Technical Specifications

#### 7.1 Standardised Naming Conventions

* **File Naming:** `kebab-case` (e.g., `my-component.tsx`).
* **Component Naming:** `PascalCase` (e.g., `UserProfile`, `ButtonPrimary`).
* **Function and Variable Naming:** `camelCase` (e.g., `fetchUserData`, `isModalOpen`).
* **Constants and Enum Naming:** `UPPER_SNAKE_CASE` for constants and enum values.
* **Type and Interface Naming:** `PascalCase` (e.g., `UserInfo`, `ButtonProps`).
* **Event Handlers:** `camelCase`, prefixed with `handle` or `on` (e.g., `handleClick`, `onChange`).

#### 7.2 Core UI Components: React Props, States, and Variants

| Component    | Prop Name (Type)     | Description                                                                 | State Name       | Visual/Behavioral Changes                                     | Variant Name  | Semantic Meaning / Use Cases                   |
| :----------- | :------------------- | :-------------------------------------------------------------------------- | :--------------- | :------------------------------------------------------------ | :------------ | :--------------------------------------------- |
| **Button** | `onClick` (function) | Event handler for click.                                                    | `default`        | Standard appearance.                                          | `primary`     | High emphasis, main call-to-action.            |
|              | `label` (string)     | Visible text.                                                               | `hover`          | Background/outline change.                                    | `secondary`   | Medium emphasis, alternative action.           |
|              | `variant` (string)   | Visual style.                                                               | `focus`          | Outline/shadow for keyboard focus.                            | `ghost`       | Low emphasis, minimal styling.                 |
|              | `size` (string)      | Physical size.                                                              | `active` / `pressed` | Slight depression/ripple effect.                              | `icon`        | Button with only an icon.                      |
|              | `disabled` (boolean) | Non-interactive.                                                            | `disabled`       | Dimmed appearance, non-interactive.                           | `contained`   | Solid background fill.                         |
|              | `isLoading` (boolean)| Displays loading spinner.                                                   | `loading`        | Spinner visible, interaction disabled.                        | `outlined`    | Bordered, transparent background.              |
| **Input** | `value` (string)     | Current input value.                                                        | `default`        | Standard appearance.                                          | `standard`    | Underlined input style.                        |
|              | `onChange` (function)| Value change handler.                                                       | `hover`          | Border/background highlight.                                  | `filled`      | Solid background fill.                         |
|              | `label` (string)     | Visible label.                                                              | `focus`          | Prominent border/shadow.                                      | `outlined`    | Distinct border around field.                  |
|              | `placeholder` (string)| Hint text.                                                                  | `active`         | Cursor visible, ready for typing.                             | `search`      | Optimised for search functionality.            |
| **Checkbox** | `checked` (boolean)  | Current state.                                                              | `default`        | Unchecked appearance.                                         | `basic`       | Standard square checkbox.                      |
|              | `onChange` (function)| State change handler.                                                       | `checked`        | Displays checkmark.                                           | `customIcon`  | Allows custom icons for states.                |
|              | `label` (string)     | Visible label.                                                              | `indeterminate`  | Displays dash/filled box.                                     | `withLabel`   | Checkbox integrated with a label component.    |
| **Dropdown** | `value` (string/array)| Selected value(s).                                                          | `default`        | Closed, displaying placeholder/value.                         | `singleSelect`| Standard dropdown for single choice.           |
|              | `onChange` (function)| Selection change handler.                                                   | `open`           | Displays list of options.                                     | `multiSelect` | Allows multiple selections.                    |
|              | `options` (array)    | Selectable options.                                                         | `hover`          | Highlight on trigger/options.                                 | `editable`    | Combobox-like, allows typing/filtering.        |
| **Modal** | `isOpen` (boolean)   | Modal visibility.                                                           | `closed`         | Modal is hidden.                                              | `default`     | Standard modal (header, body, footer).         |
|              | `onClose` (function) | Request to close handler.                                                   | `open`           | Modal visible, overlay active, focus trapped.                 | `alert`       | For critical alerts with distinct style.       |
|              | `title` (string)     | Modal title.                                                                | `loading`        | Loading indicator in content.                                 | `confirmation`| For user confirmations of actions.             |
| **Card** | `children` (ReactNode)| Content.                                                                    | `default`        | Standard appearance.                                          | `elevated`    | With distinct shadow, floats above background. |
|              | `title` (string)     | Main title.                                                                 | `hover`          | Subtle shadow/border highlight.                               | `flat`        | No shadow, blends with background.             |
|              | `variant` (string)   | Visual style.                                                               | `active`         | Visual feedback on click.                                     | `outlined`    | Visible border, no shadow.                     |
| **Table** | `data` (array)       | Data objects.                                                               | `default`        | Displays data with default settings.                          | `basic`       | Standard table with minimal styling.           |
|              | `columns` (array)    | Column definitions.                                                         | `loading`        | Skeleton loader/spinner over content.                         | `striped`     | Alternating row background colours.            |
|              | `enableSorting` (boolean)| Enables sorting.                                                          | `empty`          | Message/illustration for no data.                             | `compact`     | Reduced row height/padding.                    |

---

### 8.0 Visual Principles & React Implementation

#### 8.1 Foundational Visual Principles

* **Typography:** The art of arranging text to be legible, readable, and appealing. It establishes hierarchy and reinforces brand identity.
* **Colour Usage:** A vital element that shapes user experience and influences decision-making. A well-chosen, consistently applied colour palette ensures balance and must meet WCAG contrast guidelines.
* **Spacing:** White space is fundamental for creating a clean, intuitive interface. It improves readability by reducing clutter and guides user attention.
* **Iconography:** A visual language that enhances navigation and conveys complex concepts at a glance. Icons must be clear, readable, and stylistically consistent.

#### 8.2 Practical React Implementation Considerations

* **Design Tokens Utilisation:** Store visual attributes (colours, fonts, spacing) as named entities (tokens). This creates a single source of truth for styling, ensuring consistency and facilitating system-wide updates and theming.
* **Responsive Design Strategies:** Ensure components adapt gracefully to various screen sizes using flexible layouts (Flexbox/Grid), media queries, and responsive hooks.
* **Consistent Theming and Branding:** Use a `ThemeProvider` component to pass a theme object down the component tree, enabling easy switching between themes (e.g., light/dark mode) and reinforcing brand identity.
* **Key Performance Considerations:** Prioritise performance from the outset by preventing unnecessary re-renders with memoisation techniques, optimising state management, lazy loading components, and virtualising large lists.

---

### 9.0 Revision History

| Version | Date         | Author        | Summary of Changes                                             |
| :------ | :----------- | :------------ | :------------------------------------------------------------- |
| 1.0     | 30/06/2025   | Craig Cottle  | Initial creation of the Core Component Design System & Style Guide. |