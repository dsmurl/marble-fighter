---
name: update-worklog
description: Update docs/WORKLOG.md with dated entries summarizing recent work. Use when the user asks to "update the worklog", "log recent work", or similar, in this repo.
---

# Update Worklog

`docs/WORKLOG.md` is a personal, first-person dev log for this project. It is
not a changelog — it reads like journal entries, including confusion,
failed attempts, and milestones, not just what eventually worked.

## Steps

1. **Read `docs/WORKLOG.md`** and find the last dated `### YYYY-MM-DD [ Weekday ]`
   section before the trailing `### Next` / `### Todo` / `### Bugs` sections.
   Those three trailing sections always stay at the very end of the file —
   new dated entries are inserted immediately above `### Next`.

2. **Get the commit history since that last dated entry:**

   ```
   git log --since="<last worklog date>" --date=format:'%Y-%m-%d %A' --pretty=format:'%ad | %h | %s' --reverse
   ```

   For any commit whose one-line summary is vague (e.g. "update", "fix"),
   run `git show <hash>` to see the actual diff/body before writing about it.
   Prefer the commit body (esp. `BAS-#`-style ticket refs and the "why"
   paragraphs Claude-authored commits tend to include) over the subject line.

3. **Cross-check Linear for tickets closed since the last dated entry** — not
   every closed ticket has a matching commit (some are pure manual/dashboard
   steps: rotating a secret, flipping a setting, closing something as no
   longer needed). The user wants every closed ticket referenced on the day
   it closed, even ones with little or no code behind them. Use the Linear
   MCP tools:

   ```
   list_issues(team: "BAS", state: "Done", orderBy: "updatedAt")
   ```

   For each Done issue with a `completedAt` on/after the last worklog date,
   check whether it's already covered by a commit-derived bullet (match by
   `BAS-#` ID). If not, add a short bullet for it on the date matching
   `completedAt`, using the issue's description/resolution notes (call
   `get_issue` for the full description if the list view truncates it) to
   say what actually happened — even if that's just "closed, turned out to
   already be done" or a one-line manual fix. Also worth a quick check of
   `state: "Canceled"` / `"Duplicate"` in case the user wants those noted
   too, but only Done tickets need a bullet by default.

4. **Compute the correct weekday for each date** — don't trust weekdays
   already in the file (some existing entries have mismatched weekdays;
   leave those alone, but get new ones right):

   ```
   date -j -f '%Y-%m-%d' 2026-07-03 '+%A'   # macOS
   ```

5. **Group commits by calendar day** and write one `### YYYY-MM-DD [ Weekday ]`
   section per day worked. Skip days with no commits — don't pad the log
   with empty sections (though note the file does sometimes contain empty
   `### <date>` headers with no bullets; that's an existing quirk, not
   something to imitate).

6. **Match the existing voice and format exactly:**
   - Plain `-` bullets, first person, past tense, terse and a little rough
     (typos in the existing log are left as-is; don't "clean up" old entries).
   - Nest related sub-steps under a parent bullet with 2-space indented
     sub-bullets when a commit/day involved several related changes.
   - Prefix genuinely big wins with `MILESTONE !!!` (this is rare — most
     days don't get one; only use it for something like "first successful
     deploy" or "the whole stack works end to end", not routine fixes).
   - Mention ticket IDs inline when the commit references one (e.g. `BAS-9`).
   - It's fine to note open problems/bugs discovered that day, not just
     what was fixed.
   - Keep entries short — a handful of bullets per day, not a full diff
     summary. Summarize intent and outcome, not file-by-file changes.

7. **Insert the new sections** directly above the `### Next` heading,
   preserving a single blank line before/after each `###` heading, matching
   the rest of the file.

8. **Do not touch** the `### Next`, `### Todo`, or `### Bugs` sections unless
   the user explicitly asks you to update those too (e.g. an item under
   `### Next` was actually completed and should move into a dated entry —
   in that case remove it from `### Next` when you log it as done).

9. Show a summary of what was added, but don't ask for confirmation before
   editing the file — this skill is only invoked when the user has already
   asked for the worklog to be updated.
