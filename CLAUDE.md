
<CRITICAL_INSTRUCTION>

## TASK MANAGEMENT

This project uses Google Tasks (via the `gtasks` MCP server) for all task tracking.

### ID format
- Top-level tasks: `TP-0001`, `TP-0002`, … (4-digit zero-padded, increment from the highest existing ID)
- Subtasks: `TP-0001.01`, `TP-0001.02`, … (parent ID + 2-digit zero-padded index)
- Always prefix the task title with the ID: `TP-0003 add cost to`

### Task notes = implementation plan
- Every task must have a step-by-step implementation plan in its notes
- Plans are numbered steps, plain text, no markdown headers
- Each step names the specific file(s) to create or modify and what to do
- Keep plans under 300 words

### Rules
- Use `mcp__gtasks__list` before creating new tasks (avoid duplicates)
- Use `mcp__gtasks__search` to find a specific task by keyword
- Mark tasks `In Progress` when you start work, `Done` when complete — don't batch updates
- Use `mcp__gtasks__create` with title (including TP-XXXX prefix) and notes (implementation plan)
- **Always pass both `title` and `notes` together when calling `mcp__gtasks__update`** — omitting either field will clear it
- Use `mcp__gtasks__delete` to remove a task

</CRITICAL_INSTRUCTION>
