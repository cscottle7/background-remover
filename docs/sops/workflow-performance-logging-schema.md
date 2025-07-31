# SOP: Workflow Performance Logging Schema

## 1.0 Purpose
To define the mandatory, structured JSON schema for logging every task event within the autonomous workflow. This schema is designed to capture rich data on performance, cost, agent reasoning, and human feedback to enable system self-improvement, cost analysis, and advanced debugging.

## 2.0 Log Entry Schema
After every task execution, the Orchestrator AI MUST generate and store a JSON log entry that conforms to the following schema.

| Field | Type | Description |
| :--- | :--- | :--- |
| **`event_id`** | UUID | [cite_start]A unique UUID for this specific log entry, ensuring traceability[cite: 647]. |
| **`workflow_run_id`** | UUID | [cite_start]A shared UUID for all tasks executed within a single run of `/workflow:run_automated`, allowing for aggregation[cite: 648]. |
| **`task_id`** | String | [cite_start]The identifier from `task_deps.md` (e.g., "1.1")[cite: 649]. |
| **`task_description`** | String | [cite_start]The full description of the task from the plan[cite: 650]. |
| **`agent_name`** | String | [cite_start]The specialist agent that executed the task (e.g., `/dev:implement-pro`)[cite: 651]. |
| **`timestamps`** | Object | [cite_start]An object containing performance timing data[cite: 652]. |
| `start_time_utc` | ISO 8601 | [cite_start]Timestamp for when the task began[cite: 653]. |
| `end_time_utc` | ISO 8601 | [cite_start]Timestamp for when the task ended[cite: 653]. |
| `duration_seconds` | Float | [cite_start]The total time taken to complete the task[cite: 654]. |
| **`status`** | Enum | The final outcome of the task. [cite_start]Valid values: `Success`, `Failed`, `HIL-Paused`[cite: 655]. |
| **`cost_data`** | Object | [cite_start]A nested object containing the final cost metrics for the task, as captured by the enhanced IACP[cite: 656]. |
| **`llm_trace`** | Array | An array of objects, capturing every individual LLM call made during the task's execution. [cite_start]This is critical for debugging agent reasoning[cite: 657]. |
| `call_sequence` | Integer | [cite_start]The order of the LLM call (1, 2, 3, etc.)[cite: 659]. |
| `model_name` | String | [cite_start]The specific model used for that call[cite: 661]. |
| `prompt` | String | [cite_start]The full prompt sent to the LLM[cite: 660]. |
| `completion` | String | [cite_start]The full completion received from the LLM[cite: 660]. |
| **`human_feedback`** | Object | [cite_start]An object populated only if the task was paused for human intervention[cite: 662]. |
| `type` | Enum | [cite_start]The type of interaction (e.g., `HIL-Approval`, `Manual-Step-Confirmation`)[cite: 663]. |
| `content` | String | [cite_start]The Director's input (e.g., "approve", "reject", "confirm")[cite: 664]. |
| `timestamp_utc` | ISO 8601 | [cite_start]When the feedback was provided[cite: 665]. |