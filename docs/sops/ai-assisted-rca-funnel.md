**Standard Operating Procedure: AI-Assisted Root Cause Analysis (RCA) Funnel**
==============================================================================

**SOP ID:** DWS-DEV-001 **Version:** 1.1 **Author:** Doc Architect **Date:** 28 June 2025

**1.0 Purpose**
---------------

To provide a structured, four-stage methodology for systematically debugging a software bug by transforming the process into a repeatable, scientific workflow. This SOP guides a developer to act as a lead investigator, using an AI assistant as an analytical partner to methodically narrow down a bug from its high-level symptoms to its precise root cause.

**2.0 Scope**
-------------

This procedure applies to all software debugging activities where an AI-assisted code editor, such as Cursor, is used. It is designed to replace ad-hoc troubleshooting with a formal, conversational inquiry.

**3.0 Roles and Responsibilities**
----------------------------------

*   **Developer:** The individual responsible for executing this debugging procedure, interacting with the AI assistant, and implementing the final code fix.
    
*   **Tech Lead / Senior Developer:** Responsible for reviewing the final implemented fix and periodically reviewing the effectiveness of this SOP.
    

**4.0 Prerequisites**
---------------------

*   The project codebase must be open in an AI-assisted code editor (e.g., Cursor, Claude Code).
    
*   The AI assistant must be properly configured and authenticated.
    
*   The developer must have a clear description of the bug's symptoms or an associated ticket number.
    

**If using Cursor**
-------------------

**5.0 Procedure: The Four-Stage Funnel**
----------------------------------------

The methodology consists of four distinct stages that progressively filter information to identify the root cause.

### **Stage 1: Symptom Description & Context Gathering**

*   Articulate the bug in plain English, providing any user-facing symptoms, exact error messages, and stack traces.
    
*   Use @ mentions to provide the AI with the initial set of files they suspect are involved.
    
*   **Prompt Template:**I am investigating a bug.
    
*   Symptom: When a user tries to update their profile picture, the upload appears to succeed, but the old picture remains. No error is shown on the UI.
    
*   Console Error: at updateUserAvatar (AvatarService.ts:45:28)
    
*   Relevant Files: I suspect the issue is in @services/AvatarService.ts or @components/ProfileUploader.tsx.
    

*   Analyze this initial information and provide an assessment of the most likely problem area and the relationship between these two files.
    

### **Stage 2: Hypothesis Generation & Code Path Tracing**

*   Ask the AI to formulate several distinct potential causes for the bug.
    
*   For each one, ask the AI to trace the code execution path that would lead to the observed error.
    
*   **Prompt Template:**Based on your initial assessment, generate 3 distinct hypotheses for the root cause of this bug. For each hypothesis, provide a brief explanation and trace the likely code execution path, starting from the handleUpload function in @components/ProfileUploader.tsx and ending at the error line in @services/AvatarService.ts.
    
*   Hypothesis 1: The file is not being correctly passed from the frontend component to the service.
    
*   Hypothesis 2: The file upload to the storage provider is succeeding, but the response object is malformed.
    
*   Hypothesis 3: There is a race condition where the database is being updated with the new URL before the file is fully available.
    

### **Stage 3: Evidence Collection via Instrumentation**

*   Choose the most plausible hypothesis and instruct the AI to instrument the relevant code with logging statements.
    
*   **Prompt Template:**Let's test Hypothesis #2. Instrument the code in @services/AvatarService.ts. Specifically, add console.log statements immediately after the call to the storage provider's SDK to log the entire response object we receive. Also, add a log statement at the very beginning of the updateUserAvatar function to log the arguments it receives.
    
*   I will run the code with these logs and provide you with the output.
    

### **Stage 4: Root Cause Confirmation & Fix Proposal**

*   Perform the action that triggers the bug, copy the resulting log output from the terminal or browser console, and provide it back to the AI.
    
*   **Prompt Template:**I have run the code with the instrumentation you added. Here is the complete log output:
    
*   \[Log Output from terminal\]
    
*   Arguments received: { userId: 123, file: \[File Object\] }
    
*   Storage provider response: { success: true, data: { location: '...' } }
    
*   Based on these logs, analyze the data flow. It appears the URL is nested inside data.location, not response.url. Confirm if this validates Hypothesis #2. Pinpoint the exact line of code that is the root cause of the error and provide a corrected version of the updateUserAvatar function.
    

**If using Claude Code**
------------------------

**Section 5.0: Procedure: Using the /debug:analyze Command**
------------------------------------------------------------

The methodology consists of four stages that are facilitated by the /debug:analyze specialist.

*   **Stage 1: Symptom Description & Context Gathering**
    
    *   **Developer Action:** The developer initiates the process by calling the debug specialist and providing the initial context when prompted.
        
    *   **Example Interaction:**
        
        1.  Developer runs: /debug:analyze
            
        2.  AI responds with a menu. Developer chooses: A) Troubleshoot an Existing Issue
            
        3.  AI asks for the Code Snippet, Error Message, and Expected vs. Actual Behaviour.
            
        4.  Developer provides the details as requested.
            
*   **Stage 2: Hypothesis Generation & Code Path Tracing**
    
    *   **Developer Action:** After the AI receives the initial context, it will generate several distinct hypotheses for the root cause. The developer reviews these hypotheses.
        
    *   **Example Interaction:** The AI will present 2-3 numbered hypotheses. The developer can then proceed by choosing one.
        
*   **Stage 3: Evidence Collection via Instrumentation**
    
    *   **Developer Action:** The developer instructs the AI to instrument the code based on the most plausible hypothesis.
        
    *   **Example Interaction:**Let's test Hypothesis #2. Please generate the console.log statements needed to see the full response object from the storage provider in @services/AvatarService.ts.
        
*   **Stage 4: Root Cause Confirmation & Fix Proposal**
    
    *   **Developer Action:** The developer runs the instrumented code, triggers the bug, and provides the log output back to the AI in the same session.
        
    *   **Example Interaction:**I have run the code. Here is the log output: \[paste log output here\]. Based on this, please confirm the root cause and provide a corrected version of the function.
        

**6.0 Quality Checks / Expected Outcomes**
------------------------------------------

*   Successful completion of this SOP is defined by a committed code fix that resolves the initial bug.
    
*   The fix must be verified by a new or existing test case that now passes.
    
*   The final commit message should reference the original bug or ticket ID.
    

**7.0 Contingencies**
---------------------

*   **If the AI cannot generate useful hypotheses in Stage 2:** The developer should simplify the problem description, provide more specific code context using @ mentions, and try again.
    
*   **If the logs in Stage 4 do not reveal the root cause:** The developer should go back to Stage 3 and instruct the AI to instrument the code with more granular logging in a different area of the suspected code path.
    

### **8.0 Revision History**

Version

Date

Author

Summary of Changes

1.0

28/06/2025

Doc Architect

Initial draft of the four-stage RCA Funnel procedure.

1.1

28/06/2025
