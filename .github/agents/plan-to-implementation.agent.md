--- 
name: Plan → Implementation (Auto plan, GPT-5 mini implementation)
description: Generate an implementation plan using the Plan agent (use the currently selected model / Auto). Hand off to the implementation agent using a specific model.
tools:
  - search
handoffs:
  - label: Start Implementation
    agent: implementation
    prompt: >
      Now implement the plan outlined above. Follow each step and commit or open a PR when appropriate.
      IMPORTANT: Do not use the `web` / `fetch_webpage` tool to read local workspace files or pass file:// URLs to web tools.
      For any local workspace file access, use the workspace file reader (`read_file`) with explicit `filePath`, `startLine`, and `endLine`.
      Use `web` only for validated HTTP/HTTPS URLs and confirm the URL scheme before calling it.
    send: false
    model: GPT-5 mini
---

# Instructions for the Plan agent

- Ask clarifying questions if the task scope is ambiguous.
- Produce:
  - High-level summary
  - Concrete implementation steps (TODOs) with file paths
  - Verification steps and tests to run
  - Expected PR description and changelog notes
- Keep the plan actionable and split into small steps the implementation agent can follow.
