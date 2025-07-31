# SOP: MCP Agent Mapping & Tooling Strategy

## 1.0 Purpose
This document defines the official mapping of specialist AI sub-agents to their required Model Context Protocol (MCP) servers. The guiding principle is the **Principle of Least Privilege**: each agent is granted access only to the tools essential for its designated function. This enhances security and ensures a clear separation of concerns.

## 2.0 Agent-to-MCP Tool Mappings

The following table specifies the approved MCP tools for each specialist sub-agent. The Orchestrator AI (acting as the MCP Host) is responsible for enforcing these permissions.

| Agent (Sub-Agent) | Role in Workflow | Required MCP Tools |
| :--- | :--- | :--- |
| **`dev_implement`** | Core Developer | `filesystem.read_file`, `filesystem.write_file`, `git.add`, `git.commit` |
| **`test_generate`** | QA Engineer | `filesystem.read_file`, `filesystem.write_file`, `docker.run_container` (for tests) |
| **`security_audit`** | Security Auditor | `filesystem.read_file`, `github.get_file_history` |
| **`asset_find`** | Research Assistant | `web.search`, `docs.search_context7` |
| **`document_create`** | Technical Writer | `filesystem.read_file`, `filesystem.write_file` |
| **`plan_creator`** | Planning Architect | `filesystem.read_file` (for CLAUDE.md) |

## 3.0 Advanced Strategy: Composite MCPs
To increase robustness and efficiency, our development roadmap will prioritise the creation of **Composite MCPs**. These are high-level tools that encapsulate complex, multi-step workflows.

A Composite MCP acts as both a server (to the Orchestrator) and a client (to other granular MCPs), abstracting a sequence of actions into a single, reliable command.

- **Example Candidate:** `create_pr_from_staging_area`
- **Internal Workflow:**
    1.  Call the `Official Git MCP` to `git_add`.
    2.  Call the `Official Git MCP` to `git_commit`.
    3.  Call the `Official Git MCP` to `git_push`.
    4.  Call the `Official GitHub MCP` to `create_pull_request`.

Adopting this pattern will make our Orchestrator's job simpler and the overall system more reliable.