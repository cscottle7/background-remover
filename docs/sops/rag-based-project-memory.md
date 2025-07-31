# SOP: RAG-Based Project Memory

## 1.0 Purpose
To define the architecture for a long-term memory system that enables our agentic workflow to learn from past projects. This protocol uses Retrieval-Augmented Generation (RAG) to provide agents with relevant historical context, allowing them to leverage successful patterns and avoid repeating past mistakes.

## 2.0 Ingestion Process
The knowledge base will be populated automatically at the conclusion of every successful project workflow.

* **Trigger:** Upon the successful completion of the final `/document:create` task, the Orchestrator AI will initiate the memory ingestion process.
* **Artifact Collection:** The Orchestrator will gather a curated set of the project's most valuable artifacts, including the final source code, the `CLAUDE.md` file, the final `task_deps.md` file, and key design documents.
* **Processing and Indexing:** These artifacts are then processed and indexed into a vector database. This involves chunking documents and code into smaller pieces, creating a vector embedding for each chunk, and storing them with associated metadata (project name, file path, etc.).

## 3.0 Retrieval Process
Specialist agents will query this knowledge base as the first step in their execution logic to inform their work.

* **Query Formulation:** When an agent receives a new task, it formulates a search query based on the `task_description`.
* **Similarity Search:** The agent converts this query into a vector and performs a similarity search against the knowledge base.
* **Context Retrieval:** The system retrieves the most relevant chunks of text or code from past projects, which represent the collective experience of the entire system.

## 4.0 Agent Prompt Modification
To integrate this capability, agents must be explicitly instructed to use this memory. The following change will be made to the `/dev:implement` agent's prompt.

### Updated Execution Logic for `/dev:implement`

1.  **Search Project Memory:** First, search the **Project Memory Knowledge Base** for similar, successfully implemented tasks using your current `task_description`. Carefully review any retrieved code snippets or architectural patterns from past projects. Use these historical examples as your primary reference.
2.  **Understand the Task:** Carefully read and understand the `{{ task_description }}`.
3.  **Analyze Context:** Thoroughly analyze the content of all context files provided in `{{ relevant_files }}`.
4.  **Formulate Solution:** Formulate the code required to complete the task, prioritizing patterns and styles found in the Project Memory.
5.  **Output Code:** Your output should ONLY be the code block containing the final file content.