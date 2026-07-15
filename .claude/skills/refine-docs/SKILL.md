---
name: refine-docs
description: Check the docs/ directory against this repo's structure conventions (per-directory README with description + Files/Subdirectories ToC tables, top/bottom back-links on every file, ToCs ordered for clarity, a mandatory baseline set of subdirectories including docs/arch/mechanisms/) and fix any drift found. Use when the user asks to "refine docs", "check the docs structure", "run Refine Docs", or similar, in this repo.
---

# Refine Docs

Keeps `docs/` browsable directly on GitHub: every directory has a `README.md` acting as its table of contents,
every file can navigate back up, and every ToC reflects what's actually on disk. This skill both **checks** for
drift and **fixes** it — don't just report problems, correct them (create missing READMEs, fix stale ToC rows, add
missing back-links, scaffold missing baseline directories, relocate misplaced docs), then report what changed.

This skill is meant to be portable: copy `.claude/skills/refine-docs/` into any project and it should establish
the same baseline `docs/` layout there, not just tidy whatever that project already happens to have.

## Baseline directory set

Every project's `docs/` must contain at least these four subdirectories — they are mandatory, not optional:

| Directory       | Purpose                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------- |
| `docs/arch/`    | Architecture reference docs: system design, infrastructure, data flow.                         |
| `docs/setup/`   | Start here: how to get the project running locally.                                            |
| `docs/how-to/`  | Practical, task-oriented guides for day-to-day and operational tasks (deploy, infra ops, etc). |
| `docs/testing/` | Current testing strategy and state.                                                            |

A project may have additional top-level directories beyond these four (e.g. a `docs/api/`) — that's fine. What's
not fine is a project missing one of the four baseline directories once it has content that belongs there.

In addition, `docs/arch/` must always contain a `mechanisms/` subdirectory — see the dedicated
[Mechanisms](#mechanisms) section below for what belongs there and why. Unlike the other baseline directories,
`mechanisms/` is mandatory unconditionally (not just "once it has content that belongs there"), because
`docs/arch/README.md` itself needs to link to it as part of the standing engineering process, even on day one
before any mechanism has been documented.

### Philosophy each README's description paragraph should carry

Rule 1 below requires every `README.md` to open with a short description of what the directory covers. For
`docs/README.md` and the four baseline directories, that description isn't just filler above the ToC tables — it
should actually orient a reader to _why_ the directory exists. When writing or fixing these specific READMEs,
make sure the description paragraph communicates:

- **`docs/README.md`** (the top-level docs README): a brief paragraph on the overall purpose of the `docs/`
  directory for this project — what documentation lives here and why — in addition to the standard Files/
  Subdirectories ToC tables. Don't let this collapse into just a ToC with no framing.
- **`docs/arch/README.md`**: **static** architecture reference — documents the project's applications, libraries,
  and included package decisions, plus an inventory of what things exist (e.g. which environment variables exist
  and what each one is for). It describes the system as it is, not how to configure, acquire, or act on any of it
  — that's `how-to/`'s job. Two docs can cover the same subject: an `arch/` doc says what it is, a `how-to/` doc
  walks through doing something with it. It must also list `mechanisms/` in its Subdirectories ToC — see
  [Mechanisms](#mechanisms).
- **`docs/setup/README.md`**: a "start here" doc set — how to stand the repo up and get it running locally, and
  how to deploy it.
- **`docs/how-to/README.md`**: **procedural** guides — a developer's helper for walking through how to actually
  get things done day-to-day around the repo (e.g. how to configure/set up environment variables and secrets),
  plus an explanation of maintenance concepts. If a doc's job is to instruct ("here's how you...") rather than
  describe ("here's what exists..."), it belongs here even if its subject also has a companion reference doc in
  `arch/`.
- **`docs/testing/README.md`**: covers testing strategy plus practical, operational guides on maintaining and
  running the test suite(s).

When scaffolding a missing baseline directory (step 8), write its README's description paragraph to match the
relevant bullet above rather than a generic placeholder.

## Mechanisms

`docs/arch/mechanisms/` is a mandatory subdirectory of `docs/arch/`, one file per **mechanism**. A mechanism is a
small, well-defined feature or self-contained part of a system — specific enough to name and scope in one
sentence: a login mechanism, a school-board mechanism, a database-cleanup mechanism. It's narrower than a whole
`arch/` subsystem doc and narrower than a `how-to/` guide — it's the unit of design that a single feature or
system component compiles down to.

**Why this exists:** documenting mechanisms is meant to be a standing part of the engineering cycle, not a
one-off writing exercise. When someone adds something new to the codebase, the expectation is that they identify
what mechanism(s) it introduces or touches, and that new mechanisms get compared against existing ones and
reviewed for compatibility before or alongside implementation — the same way a design review would catch two
features quietly assuming incompatible things about the same piece of state. `docs/arch/mechanisms/` is where
that comparison has a fixed place to happen, instead of living only in someone's head or a chat thread.

**Purpose of a mechanism doc — it serves two distinct readers:**

1. **Future AI review, during this feature and later ones.** The doc should lay out the current mental model
   behind the mechanism plainly enough that an AI reviewing a future change (to this mechanism or to a different
   one that interacts with it) can check the new work against it without having to reverse-engineer it from code.
2. **A human walking through the mechanism's ideation.** The doc should also read as a human-facing narrative:
   what the mechanism is for, what mentality/ideation led to it, and the reasoning behind its architecture from a
   code/system standpoint — not just what it does, but why it was shaped the way it was.

A mechanism doc is not a spec of current behavior only (that's what the rest of `arch/` and code comments are
for) — it's specifically the record of intent and design reasoning that doesn't survive reading the code alone.

**Structure:** `docs/arch/mechanisms/` follows the same conventions as any other `docs/` directory (rules 1-3
above) — it needs its own `README.md` with a Files ToC (one row per mechanism doc) and a description paragraph
explaining the concept above, and each mechanism file follows the standard back-link and structure rules. Prefer
one file per mechanism (e.g. `login-mechanism.md`, `db-cleanup-mechanism.md`) over bundling several into one doc,
so each can be reviewed and linked to independently.

When checking/fixing this repo's docs (step 1 and step 8), treat a missing `docs/arch/mechanisms/` the same as a
missing baseline directory: scaffold the directory and its `README.md` even if no mechanism docs exist yet.

**This skill does not go looking for mechanisms to document.** Everything else in this skill is about scanning
`docs/` and reconciling it against what's on disk — but new mechanism docs are not something to infer from
scanning the codebase for features that look mechanism-shaped. A new mechanism doc gets created only when the
user initiates it by expressing that they're picturing, ideating, or designing a new mechanism — e.g. "I want to
make a new mechanism in this code," "let's design a mechanism for X," or similar. Absent that kind of prompt,
running this skill should only ensure `docs/arch/mechanisms/` exists and is structurally sound (README, ToC,
back-links) — it should not add, remove, or rewrite individual mechanism files on its own initiative.

## The conventions being enforced

1. **Every directory under `docs/` (including `docs/` itself) has a `README.md`** containing, in this order:
   - The back-link (see rule 2).
   - `# Title`
   - A 1-3 sentence description of what the directory covers.
   - `## Files` — a table (`| Link | Description |`) of the files in _that_ directory only (not subdirectories),
     each a relative link with a one-line description. If there are none, the body is `_None._` instead of an
     empty table.
   - `## Subdirectories` — same table shape, one row per immediate subdirectory, linking to `<dirname>/README.md`.
     `_None._` if there are none.
   - The closing `---` + back-link (see rule 2).

2. **Back-navigation links** on every `.md` file under `docs/`, including every `README.md`:
   - The literal first line of the file, followed by a blank line.
   - Repeated at the very end: a blank line, a `---` line, a blank line, then the same back-link line again.
   - Non-README file in `docs/X/Y`: target `./README.md` (its own directory's README). Text names that directory:
     `[← Back to docs/X/Y](./README.md)`.
   - `README.md` in `docs/X/Y`: target `../README.md` (the _parent_ directory's README). Text names the parent:
     `[← Back to docs/X](../README.md)`.
   - Exception: `docs/README.md` — its parent is the repo root, so target `../README.md` (the root `README.md`)
     and text `[← Back to project root](../README.md)`.

3. **ToC row order is deliberate, not alphabetical.** Within a Files or Subdirectories table, order rows so a
   reader landing cold gets the right first impression:
   - An entry-point/"start here" doc (e.g. a launch/setup/getting-started guide) leads the table, even if its
     filename sorts later alphabetically.
   - Where rows have a natural operational or dependency sequence (e.g. launch → configure → deploy → tear down,
     or foundation → infra → deploy → tool), use that sequence.
   - General/overview docs before narrow/specific ones (e.g. an architecture overview before a single-feature
     deep-dive).
   - Optional/nice-to-have entries near the end, not mixed in with required steps.
   - If a table has no natural sequence (e.g. a handful of unrelated reference docs), alphabetical is fine — don't
     force an ordering that isn't there.

## Steps

1. **Check the baseline directory set.** Confirm `docs/arch/`, `docs/setup/`, `docs/how-to/`, and `docs/testing/`
   all exist, and confirm `docs/arch/mechanisms/` exists (see [Mechanisms](#mechanisms)). Note any that are
   missing entirely — these get scaffolded in the fix step, not just flagged.

2. **Enumerate the tree.** `find docs -type f -name '*.md'` and `find docs -type d`.

3. **Check every directory has a `README.md`.** Flag any that don't (this includes any baseline directory from
   step 1 that's missing outright — it needs both the directory and its `README.md`).

4. **For every `README.md`, check its Files and Subdirectories tables against reality:**
   - Every non-README file in that directory should have exactly one row in Files. Flag extra rows (stale/deleted
     files still linked) and missing rows (real files not listed).
   - Every immediate subdirectory should have exactly one row in Subdirectories, linking to its `README.md`. Same
     stale/missing check.
   - Confirm the directory has a description above the tables (not just a bare title).

5. **For every `.md` file, check the back-link rule.** The most reliable way is a small script rather than
   eyeballing — something equivalent to:

   ```python
   import re, os
   errors = []
   for root, dirs, files in os.walk('docs'):
       for f in files:
           if not f.endswith('.md'):
               continue
           path = os.path.join(root, f)
           content = open(path).read()
           lines = content.splitlines()
           for m in re.finditer(r'\[([^\]]*)\]\(([^)]+)\)', content):
               target = m.group(2).split('#')[0]
               if target.startswith('http') or not target:
                   continue
               if not os.path.exists(os.path.normpath(os.path.join(root, target))):
                   errors.append(f"{path}: broken link -> {target}")
           if not lines or not lines[0].startswith('[←'):
               errors.append(f"{path}: first line is not a back-link")
           nonempty = [l for l in lines if l.strip()]
           if not nonempty or not nonempty[-1].startswith('[←'):
               errors.append(f"{path}: last line is not a back-link")
   print('\n'.join(errors) if errors else 'All good.')
   ```

   This also catches broken relative links anywhere in the file, not just the back-links — run it after every fix
   too, not just at the start.

6. **Check ToC ordering** per rule 3 above — this one is judgment, not scriptable. Read each table and ask "would
   someone new to this directory be better served by a different order?"

7. **Analyze whether existing docs are in the right place.** For each non-README file (and any subdirectory that
   isn't one of the baseline four), judge whether it currently sits in the best location:
   - Does it clearly belong under one of the baseline directories (`arch/`, `setup/`, `how-to/`, `testing/`)
     instead of wherever it is now (e.g. an architecture doc sitting loose in `docs/` root, or a deploy guide
     living under `arch/` instead of `how-to/`)? Flag it to move.
   - If it doesn't fit the baseline four, does it fit better under some _other_ existing directory in this
     project's `docs/` tree than its current one? Flag it to move there instead.
   - Only leave content in place, or create a new non-baseline directory for it, if it genuinely doesn't fit
     anywhere that already exists — don't force-fit unrelated content into a baseline directory just to avoid
     creating a new one.
   - This step is about _relocating_ misplaced content, not duplicating it — a doc should end up with exactly one
     home.

8. **Fix everything found**, don't just list it:
   - Missing baseline directory (from step 1) → create it and scaffold a `README.md` following the template in
     rule 1 (title, description, `_None._` Files/Subdirectories tables to start, back-link).
   - Missing `README.md` in an existing directory → create one following the template in rule 1, writing real
     one-line descriptions (read enough of each file to describe it accurately, don't guess from the filename
     alone).
   - Misplaced file/directory (from step 7) → move it to its correct location, then update: the ToC row in the
     old parent's `README.md` (remove it), the ToC row in the new parent's `README.md` (add it), the moved file's
     own back-link (it now points to a different parent), and any other doc's links that pointed at the old path.
   - Stale/missing ToC rows → add or remove rows to match reality.
   - Missing/wrong back-links → insert/correct per rule 2.
   - Bad ordering → reorder rows per rule 3.

9. **Re-run the link/back-link script from step 5 after fixing** to confirm the fixes didn't introduce a new
   break, then report a short summary of what was changed.

## Content accuracy (do this when asked to refine or review a specific doc's content, not just structure)

This skill's core job is structural, but docs repeatedly go stale in ways that pure structure checks can't catch
(a wrong service/resource named, stale paths, a whole feature undocumented, a doc describing an older version of
the code). When asked to refine a doc's actual content:

- **Verify claims against the current source**, not just internal consistency — grep for the function/env
  var/file/workflow the doc names and confirm it still exists and behaves as described. Don't assume prose that
  reads fluently is still accurate.
- **Check for parallel/duplicate content** describing the same thing in two places (e.g. two docs for the same
  feature in different directories) - either merge them or, if both describe genuinely different still-live
  implementations, clearly label both as such rather than picking one silently.
- **If a design decision is genuinely unresolved** (two implementations coexist, no clear "right" one yet), don't
  invent an answer - document the current state honestly and point to a tracking ticket instead.

## Test case to verify this skill works

Before relying on this skill, sanity-check it catches drift on purpose: create a directory with a missing
`README.md`, a `README.md` with a ToC row for a file that doesn't exist, and a file with no back-link. Running
this skill's checks should flag all three; running its fixes should resolve all three without breaking anything
else (confirm via a final run of the step-5 script).

Also sanity-check the two behaviors added for portability:

- **Missing baseline directory entirely.** Temporarily remove one of `docs/arch/`, `docs/setup/`, `docs/how-to/`,
  or `docs/testing/` (rename it aside, don't delete). Running this skill should flag it as missing in step 1 and,
  when fixing, recreate the directory with a scaffolded `README.md` matching the template.
- **Misplaced existing doc.** Drop a doc file that clearly belongs in one baseline directory into a different one
  (e.g. a deploy guide under `docs/arch/` instead of `docs/how-to/`). Running this skill should flag it in step 7
  and, when fixing, move it to the correct directory with both parent READMEs' ToCs and the file's own back-link
  updated to match.
- **Missing `docs/arch/mechanisms/`.** Temporarily rename it aside. Running this skill should flag it as missing
  in step 1 and, when fixing, recreate the directory with a scaffolded `README.md` whose description paragraph
  explains the mechanisms concept (per the [Mechanisms](#mechanisms) section), not a generic placeholder.
