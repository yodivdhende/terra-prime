# Claude Instructions

## Branch Policy

Always use the `staging` branch for development when no specific branch is specified. Never default to `main` for development work.

<CRITICAL_INSTRUCTION>

## TASK MANAGEMENT

This project uses **GitHub Issues** (via the `gh` CLI) for all task tracking. The repo is `yodivdhende/terra-prime`.

### Issue title and body
- Every issue title must be prefixed with its TP ID (see **TP ID scheme** below)
- Every task must have a step-by-step implementation plan in its body
- Plans are numbered steps, plain text, no markdown headers
- Each step names the specific file(s) to create or modify and what to do
- Keep plans under 300 words

### TP ID scheme
- Every issue gets a TP ID in its title: `[TP-NNNN] <title>` where NNNN is the GitHub issue number zero-padded to 4 digits
- After creating an issue, read back its number with `gh issue create ... | tail -1` (the URL contains the number), then immediately rename it: `gh issue edit <N> --title "[TP-NNNN] <title>"`
- Subtasks use their **parent's** TP number plus a two-digit sequence: `[TP-NNNN.SS] <title>` (SS = 01, 02, 03…)
- To find the next SS for a parent, count existing subtasks listed in the parent body and increment

### Parent / subtask relationships
- Parent issues get the `epic` label
- Parent body ends with a `### Subtasks` section containing a checklist of `- [ ] #N [TP-NNNN.SS] <title>` lines
- Subtask body starts with `Parent: #N` so the link is bidirectional
- Tick the checkbox in the parent when a subtask is closed

### Rules
- Use `gh issue list` before creating new tasks (avoid duplicates)
- Use `gh issue list --search "<keyword>"` to find a specific task
- Use `gh issue create --title "[TP-NNNN] <title>" --body "<plan>"` (add `--label epic` for parents); apply the TP ID immediately after creation once the issue number is known
- Mark work-in-progress by assigning yourself: `gh issue edit <N> --add-assignee @me`
- Close with `gh issue close <N>` when complete — don't batch updates
- Use `gh issue edit <N> --body "<new>"` to update; pass the full new body (it replaces, not appends)
- Use `gh issue delete <N>` to remove a task

</CRITICAL_INSTRUCTION>
