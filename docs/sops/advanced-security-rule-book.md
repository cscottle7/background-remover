# Standard Operating Procedure: Advanced Security Rulebook for Next.js Development

---

**SOP ID:** DWS-SEC-001
**Version:** 1.0
**Author:** Craig Cottle
**Date:** 30 June 2025

---

### 1.0 Purpose

To establish a comprehensive set of secure coding standards, automated enforcement rules, and architectural patterns for developing Next.js applications. This SOP serves as the primary security guide, particularly when using AI-assisted tools, to mitigate common and emerging vulnerabilities and to foster a secure-by-design development culture.

---

### 2.0 Scope

This SOP is mandatory for all Next.js development projects at Discover Web Solutions. It applies to all developers and AI assistants involved in writing or reviewing code for such projects.

---

### 3.0 Roles and Responsibilities

* **Developer:** Responsible for applying these secure coding patterns, utilising the recommended ESLint rules, and following the secure prompt engineering guidelines.
* **Architect Pro (AI Gem):** Must adhere to these security principles when generating code or Master Prompts.
* **Code Security Auditor (AI Gem):** Must use this rulebook as its primary knowledge base when conducting security audits.
* **Tech Lead:** Responsible for ensuring compliance with this SOP during code reviews and for updating the rulebook as new threats emerge.

---

### 4.0 AI-Specific Vulnerabilities & Secure Counterparts

AI code generation tools can accelerate development but may replicate insecure patterns. Developers must be vigilant in reviewing AI-generated code for common vulnerabilities.

#### 4.1 Cross-Site Scripting (XSS)

* **Insecure AI-Generated Pattern:** Direct use of `dangerouslySetInnerHTML` with unsanitised user input.

    ```typescript
    // Insecure AI-generated: Direct use of dangerouslySetInnerHTML
    // app/components/CommentDisplay.tsx
    import React from 'react';

    function CommentDisplay({ commentContent }: { commentContent: string }) {
      return (
        <div dangerouslySetInnerHTML={{ __html: commentContent }} />
      );
    }
    ```

* **Secure Counterpart:** Employ a robust sanitisation library like DOMPurify before rendering.

    ```typescript
    // Secure: Using DOMPurify for sanitization
    // app/components/CommentDisplay.tsx
    import React from 'react';
    import DOMPurify from 'dompurify';

    function CommentDisplay({ commentContent }: { commentContent: string }) {
      const sanitizedHtml = DOMPurify.sanitize(commentContent);
      return (
        <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
      );
    }
    ```

#### 4.2 Cross-Site Request Forgery (CSRF)

* **Insecure AI-Generated Pattern:** An API Route that performs a sensitive operation relying only on session cookies for authentication, without a separate CSRF token.

    ```typescript
    // Insecure AI-generated: API Route without CSRF protection
    // app/api/user/update-email/route.ts
    import { NextResponse } from 'next/server';
    import { cookies } from 'next/headers';

    export async function POST(req: Request) {
      const sessionCookie = cookies().get('session_id')?.value;
      if (!sessionCookie) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
      const { newEmail } = await req.json();
      // ... update user email in DB based on sessionCookie...
      return NextResponse.json({ message: 'Email updated successfully' });
    }
    ```

* **Secure Counterpart:** Implement CSRF token validation. While Next.js Server Actions have built-in protection, API Routes require explicit handling.

    ```typescript
    // Secure: API Route with CSRF token validation (example using a dummy token check)
    // app/api/user/update-email/route.ts
    import { NextResponse } from 'next/server';
    import { cookies } from 'next/headers';

    function validateCsrfToken(sessionId: string, token: string): boolean {
      // Logic to verify the token against the session or a stored token.
      return sessionId === `valid_session_${token}`;
    }

    export async function POST(req: Request) {
      const sessionCookie = cookies().get('session_id')?.value;
      const csrfToken = req.headers.get('x-csrf-token'); // Custom header for CSRF token

      if (!sessionCookie || !csrfToken || !validateCsrfToken(sessionCookie, csrfToken)) {
        return NextResponse.json({ message: 'Unauthorized or invalid CSRF token' }, { status: 401 });
      }
      const { newEmail } = await req.json();
      //... update user email in DB...
      return NextResponse.json({ message: 'Email updated successfully' });
    }
    ```

#### 4.3 Server-Side Request Forgery (SSRF)

* **Insecure AI-Generated Pattern:** An API Route that fetches content from a user-supplied URL without validation.

    ```typescript
    // Insecure AI-generated: SSRF vulnerability in API Route
    // app/api/fetch-image/route.ts
    import { NextResponse } from 'next/server';
    export async function GET(req: Request) {
      const { searchParams } = new URL(req.url);
      const imageUrl = searchParams.get('url');
      if (!imageUrl) {
        return NextResponse.json({ message: 'URL missing' }, { status: 400 });
      }
      try {
        // AI might suggest direct fetch without validation
        const response = await fetch(imageUrl);
        const imageBuffer = await response.arrayBuffer();
        return new NextResponse(Buffer.from(imageBuffer), { headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream' }});
      } catch (error) {
        return NextResponse.json({ message: 'Failed to fetch image' }, { status: 500 });
      }
    }
    ```

* **Secure Counterpart:** Implement strict URL validation, whitelisting trusted domains and protocols.

    ```typescript
    // Secure: SSRF prevention with URL validation
    const ALLOWED_DOMAINS = ['example.com', 'trusted-cdn.com'];

    function isSafeUrl(url: string): boolean {
      try {
        const parsedUrl = new URL(url);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          return false;
        }
        return ALLOWED_DOMAINS.includes(parsedUrl.hostname);
      } catch {
        return false;
      }
    }

    // In the handler:
    if (!imageUrl || !isSafeUrl(imageUrl)) {
      return NextResponse.json({ message: 'Invalid or unsafe URL' }, { status: 400 });
    }
    const response = await fetch(imageUrl, { redirect: 'error' }); // Prevent redirects
    ```

#### 4.4 Injection (SQL)

* **Insecure AI-Generated Pattern:** Direct string concatenation of user input into a database query.

    ```typescript
    // Insecure AI-generated: SQL Injection in a Server Action
    'use server';
    import { db } from '@/lib/db';

    export async function searchProducts(searchTerm: string) {
      // AI suggests direct string concatenation for simplicity
      const query = `SELECT * FROM products WHERE name LIKE '%${searchTerm}%'`; // INSECURE
      const products = await db.query(query);
      return { success: true, data: products.rows };
    }
    ```

* **Secure Counterpart:** Always use parameterized queries or an ORM that handles escaping.

    ```typescript
    // Secure: SQL Injection prevention with parameterized queries
    'use server';
    import { sql } from '@vercel/postgres';

    export async function searchProducts(searchTerm: string) {
      const { rows: products } = await sql`SELECT * FROM products WHERE name LIKE ${'%' + searchTerm + '%'}`;
      return products;
    }
    ```

---

### 5.0 Secure Prompt Engineering Guidelines

Prompt engineering is a critical security control. The following guidelines must be followed to steer AI toward generating secure code.

* **Two-Stage Prompting:**
    * **Stage 1 (Functional Requirement):** First, prompt the AI for the core functionality to get a working draft.
    * **Stage 2 (Security Refinement):** Treat the AI's first output as a draft. Provide a second, explicit prompt to refactor the code with specific security controls (e.g., input validation, authorisation checks).

* **Use Security-Focused Prompts:**
    * **Input Validation:** "Ensure all user inputs in this Server Action are strictly validated using a Zod schema for..."
    * **Authorisation:** "Implement explicit authorisation checks at the beginning of this Server Action to ensure the user can only update their own profile."
    * **Injection Prevention:** "Ensure all database queries use parameterized queries to prevent SQL injection. Do NOT use string concatenation."
    * **XSS Prevention:** "For any dynamically rendered HTML, use `DOMPurify.sanitize()` before applying `dangerouslySetInnerHTML`."

* **Request Security Commentary:** Prompt the AI to justify its approach from a security perspective.
    * "Explain the security considerations for this code. What potential vulnerabilities does it mitigate?"
    * "List any potential security risks or assumptions associated with this code snippet."

* **Foster AI Output Skepticism:** All developers must understand that AI is a pattern-matcher, not a security expert. AI-generated code must undergo the same rigorous human peer review as human-written code, with a specific focus on security.

---

### 6.0 Rendering Strategy Security

Each Next.js rendering strategy has unique security implications that must be understood and mitigated.

| Feature / Strategy                   | Primary Implications                                                                    | Unique Attack Vectors                                                                                                                                                                                               | Must-Do Configs/Practices                                                                                                                                                                                  | Common Pitfalls                                                                                                                                                               |
| :----------------------------------- | :-------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Static Site Generation (SSG)** | Pre-rendered HTML. Primarily client-side attack surface.                                | - Data Leakage (Build-time): Sensitive data accidentally embedded in static HTML/JS bundles.                                                                                                                         | 1. No secrets in `getStaticProps`.<br>2. Client-side input validation for API calls.<br>3. Secure backend API endpoints.                                                                                        | Accidentally deploying .env files. Relying solely on client-side validation.                                                                                                  |
| **Server-Side Rendering (SSR)** | Dynamic rendering per request on server. Larger server-side attack surface.             | - Server-Side Injection: SQLi, NoSQLi, Command Injection.<br>- DoS: Heavy server load from complex requests.                                                                                                        | 1. Robust server-side input validation (Zod).<br>2. Parameterized DB queries.<br>3. Secure session management (HttpOnly cookies).                                                                            | Direct string concatenation in queries. Exposing sensitive data in props.                                                                                                     |
| **Incremental Static Regeneration (ISR)** | Hybrid of SSG & SSR. Pre-rendered but revalidated. Attack surface similar to SSG (client) but also revalidation endpoint (server). | - Cache Poisoning: Insecure revalidation.<br>- DoS: Triggering excessive revalidations.                                                                                                                            | 1. Secure revalidation paths (use secrets).<br>2. Rate limit revalidation endpoint.<br>3. Validate revalidated content.                                                                                      | Using guessable revalidation secrets. Not rate-limiting the revalidation endpoint.                                                                                            |
| **React Server Components (RSC) / Server Actions** | Blurs client/server boundaries. Server-side logic for rendering. Server Actions introduce new RPC endpoints. | - Accidental Data Leakage: Sensitive props passed to client components.<br>- Insecure Server Actions: Lack of auth/auth checks. | 1. Authorisation at data layer.<br>2. Taint tracking for sensitive data.<br>3. Explicit input validation for Server Actions. | Assuming "server-only" is automatically secure. Passing raw DB objects as props. |

---

### 7.0 Secure Data Handling Patterns

* **Prioritise Server-Side Logic:** Fetch sensitive data and interact with databases or protected APIs on the server (Server Components, API Routes, Server Actions) to keep credentials and sensitive information off the client.
* **Use a Data Access Layer (DAL):** Centralise all database interaction logic into a DAL. This layer is responsible for enforcing authorisation checks, ensuring that queries are secure and that data returned is properly filtered.
* **Use Data Transfer Objects (DTOs):** When passing data from the server to client components, use DTOs to explicitly shape the data and expose only necessary, non-sensitive fields. This prevents accidental leakage of sensitive information like password hashes or internal IDs.
* **Validate All Input with Zod:** Use Zod to define and enforce schemas for all data entering the system via API Routes or Server Actions. This is the first line of defence against injection attacks and data corruption.
* **Handle Errors Gracefully:** Implement `try...catch` blocks for all I/O operations. Log detailed errors on the server and return generic, non-revealing error messages to the client to prevent information disclosure.

---

### 8.0 Authentication & Authorisation

* **Embrace Defence-in-Depth:** Never rely on a single layer for security. Authorisation checks must be performed at multiple layers: at the Edge/WAF, in middleware (for UX), within the Server Action/API Route, and finally at the Data Access Layer (DAL).
* **Avoid Anti-Patterns:**
    * Do Not rely solely on Next.js Middleware for authorisation.
    * Do Not store JWTs or session tokens in `localStorage`. Use `HttpOnly`, `Secure`, `SameSite=Strict` cookies instead.
    * Do Not rely on client-side logic to hide UI elements as a form of security.
* **Use Established Libraries:** Leverage battle-tested libraries like Auth.js (NextAuth.js) for handling authentication. Building custom authentication is complex and error-prone.

---

### 9.0 Automated Security Enforcement

#### 9.1 Critical ESLint Rules

Integrate ESLint with security plugins into the IDE and CI/CD pipeline to catch common vulnerabilities early. High-priority rules include:

* `no-dangerously-set-innerhtml` (from `eslint-plugin-react`) to prevent XSS.
* `@typescript-eslint/no-explicit-any` to enforce type safety and prevent type-related bypasses.
* `security/detect-non-literal-fs-filename` to prevent path traversal.
* `security/detect-child-process` to prevent command injection.
* `react/jsx-no-target-blank` to prevent tabnabbing.

#### 9.2 SAST Tool Analysis

A multi-tool approach is recommended for comprehensive Static Application Security Testing (SAST).

| Feature / Tool     | Detection Strengths                                                                                                            | Limitations                                                                                                                               | Next.js Specifics                                                                                                                                                                | CI/CD Integration                                                              |
| :----------------- | :----------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------- |
| **Snyk** | - Dependency Security (SCA): Excellent at identifying vulnerabilities in npm packages.<br>- Open Source Focus: Strong on known CVEs in libraries. | - Custom Code Analysis Depth: May not match SonarQube for complex business logic flaws.                                                   | Can detect common vulnerabilities (SQLi, XSS) within Server Actions and API Routes through taint analysis. Its dependency scanning is critical for the npm ecosystem.               | Excellent. Designed for developer-friendly, fast scans and immediate feedback. |
| **SonarQube** | - Code Quality & Technical Debt: Very strong in detecting general code quality issues and bugs.<br>- Deeper SAST (Custom Code): More comprehensive at analysing custom business logic for complex security vulnerabilities (e.g., taint analysis). | - Dependency Scanning (SCA): Snyk is generally superior for open-source dependency vulnerabilities.<br>- False Positives: Can sometimes generate more false positives. | Deeper taint analysis can track data flow through Server Actions and API Routes to identify complex injection types.                                                             | Very Good. Integrates well with major CI/CD pipelines, often used to gate merges. |

**Recommended Toolchain:**

* **ESLint:** For immediate, in-IDE feedback and preventative coding standards.
* **Snyk:** For best-in-class dependency scanning (SCA) and basic SAST in CI/CD.
* **SonarQube:** For deep, centralised SAST and managing long-term code quality and security technical debt.

---

### 10.0 Cursor Rules Specification

The following rules must be implemented in the project's `.cursor/rules` directory to provide automated, contextual security guidance to the AI.

#### 10.1 Rule 1: `nextjs-server-action-auth-check`

* **Description:** Enforces explicit authentication and authorisation checks at the very beginning of Next.js Server Actions.
* **Detection Logic:** Flags any function marked with 'use server' that does not have an immediate call to an authentication/session utility (e.g., `getServerSession()`) followed by a conditional check and early exit (throw or return).
* **Severity:** Error

#### 10.2 Rule 2: `nextjs-sanitize-dangerously-set-innerhtml`

* **Description:** Ensures that all uses of `dangerouslySetInnerHTML` are accompanied by explicit sanitisation using `DOMPurify.sanitize()` or a similar trusted library.
* **Detection Logic:** Flags any use of `dangerouslySetInnerHTML` where the `__html` property is not the result of a call to a known sanitisation function.
* **Severity:** Error

#### 10.3 Rule 3: `nextjs-no-unvalidated-redirect`

* **Description:** Flags unvalidated redirects where the target URL is derived directly from user input, preventing Open Redirect vulnerabilities.
* **Detection Logic:** Flags calls to `NextResponse.redirect` or `redirect()` where the URL argument is traced back to a user-controlled source (e.g., `req.nextUrl.searchParams`, `formData`) without passing through a validation or whitelisting function.
* **Severity:** Error

---

### 11.0 Revision History

| Version | Date         | Author        | Summary of Changes                             |
| :------ | :----------- | :------------ | :--------------------------------------------- |
| 1.0     | 30/06/2025   | Craig Cottle | Initial creation of the Advanced Security Rulebook for Next.js. |