---
phase: 260714-bje-railway-deploy
plan: 01
subsystem: infra
tags: [docker, railway, huggingface-spaces, deployment, chainlit]

# Dependency graph
requires:
  - phase: 04-deployment
    provides: Dockerfile + chroma_db build pattern already working on HuggingFace Spaces
provides:
  - Dockerfile CMD that dynamically binds Railway's $PORT while keeping HF Spaces on 7860
  - chroma_db tracked in git so Railway's GitHub-based build context contains the pre-indexed vector store
  - railway.json pinning the DOCKERFILE builder
  - README "Deploy to Railway" section (GitHub + CLI paths, required Variables, no-Volume note)
affects: [deployment, infra, README]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shell-form Dockerfile CMD for env-var expansion (${PORT:-7860}) instead of exec-form JSON array"
    - "railway.json config-as-code to pin DOCKERFILE builder and avoid Railpack/Nixpacks auto-detection"

key-files:
  created:
    - railway.json
  modified:
    - Dockerfile
    - .gitignore
    - README.md
    - chroma_db/ (newly tracked, not modified in content)

key-decisions:
  - "Used shell-form CMD (not exec-form JSON array) so $PORT expands at container start; EXPOSE 7860 kept unchanged since Railway ignores it and HF Spaces uses it as a routing hint"
  - "Committed chroma_db as-is (no re-indexing) since it is read-only at query time and only needs to exist inside the built image; no Railway Volume needed"
  - "railway.json omits startCommand — the Dockerfile CMD already handles dynamic $PORT binding, so no override needed"

patterns-established:
  - "Multi-target Docker deployment: same Dockerfile serves both Railway (dynamic $PORT) and HuggingFace Spaces (fixed 7860) via shell-form CMD fallback syntax"

requirements-completed:
  - DEPLOY-RAILWAY-01
  - DEPLOY-RAILWAY-02
  - DEPLOY-RAILWAY-03

coverage:
  - id: D1
    description: "Dockerfile CMD binds Railway's dynamically injected $PORT while falling back to 7860 for HuggingFace Spaces (unchanged)"
    requirement: "DEPLOY-RAILWAY-01"
    verification:
      - kind: other
        ref: "grep -F 'PORT:-7860' Dockerfile && grep -Eq '^CMD chainlit run app.py' Dockerfile && ! grep -Eq '^CMD \\[' Dockerfile && grep -q 'EXPOSE 7860' Dockerfile"
        status: pass
    human_judgment: false
  - id: D2
    description: "chroma_db (pre-indexed vector store) is tracked in git so Railway's GitHub-based build context contains it for the Dockerfile COPY step"
    requirement: "DEPLOY-RAILWAY-02"
    verification:
      - kind: other
        ref: "git ls-files chroma_db (returns chroma.sqlite3 + segment dir) && ! grep -Eq '^\\s*chroma_db/' .gitignore"
        status: pass
    human_judgment: false
  - id: D3
    description: "railway.json pins the DOCKERFILE builder and README documents Railway deployment (required Variables, GitHub + CLI paths, $PORT note, no-Volume note)"
    requirement: "DEPLOY-RAILWAY-03"
    verification:
      - kind: other
        ref: "python -c \"import json; d=json.load(open('railway.json')); assert d['build']['builder']=='DOCKERFILE'\" && grep -q 'Deploy to Railway' README.md && grep -q 'ANTHROPIC_API_KEY' README.md && grep -q 'OPENAI_API_KEY' README.md"
        status: pass
    human_judgment: false
  - id: D4
    description: "Actual deployment to Railway (pushing to GitHub, linking the Railway project, setting secrets, generating a domain, and verifying the live URL responds)"
    verification: []
    human_judgment: true
    rationale: "Requires the user's own Railway account/CLI session and cannot be performed by the executor — documented as manual_user_steps in the plan and the README's Deploy to Railway section."

# Metrics
duration: ~20min
completed: 2026-07-14
status: complete
---

# Quick Task 260714-bje: Deploy RAG CV Chatbot to Railway (repo-side prep) Summary

**Dockerfile now binds Railway's dynamic $PORT (shell-form CMD) while staying on 7860 for HF Spaces, chroma_db is tracked in git for Railway's build context, and railway.json + README document the two-path (GitHub/CLI) manual deploy.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-07-14
- **Tasks:** 3/3
- **Files modified:** 4 (Dockerfile, .gitignore, README.md) + chroma_db/ (5 tracked files, newly added)

## Accomplishments
- Dockerfile CMD switched from exec-form (hardcoded `--port 7860`) to shell-form (`--port ${PORT:-7860}`), so Railway's injected `$PORT` is honored while HuggingFace Spaces (no `PORT` env var) still binds 7860
- `chroma_db/` (pre-indexed vector store: `chroma.sqlite3` + one UUID segment directory) is now tracked in git — no longer gitignored — so a fresh GitHub checkout / `railway up` upload contains it for the Dockerfile's `COPY chroma_db ./chroma_db` step
- `railway.json` added at repo root, pinning the `DOCKERFILE` builder and `Dockerfile` path, with `ON_FAILURE` restart policy
- README gained a "Deploy to Railway" subsection under `## Deployment`, documenting both the GitHub-dashboard path and the CLI path (`railway login` / `link` / `up` / `variables` / `domain`), the two required Variables (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`), the dynamic-`$PORT` behavior, and the no-Volume note — HF Spaces and Local Docker subsections left untouched

## Task Commits

Each task was committed atomically:

1. **Task 1: Bind Railway's dynamic $PORT in the Dockerfile CMD (keep HF Spaces on 7860)** - `5976195` (feat)
2. **Task 2: Track the pre-indexed chroma_db so Railway's build context contains it** - `19268e0` (feat)
3. **Task 3: Add minimal railway.json and document Railway deployment in README** - `ee22853` (feat)

_No TDD tasks in this plan; each commit is a single feat._

## Files Created/Modified
- `Dockerfile` - CMD switched to shell-form binding `--host 0.0.0.0 --port ${PORT:-7860}`; `EXPOSE 7860` retained; comment updated to explain dynamic port behavior
- `.gitignore` - removed the `chroma_db/` ignore line and its comment; `.env` and all other ignores untouched
- `chroma_db/` - newly tracked (`chroma.sqlite3` + `48bb2e5b-8535-4d52-84c8-084d96a87827/` segment dir); content copied as-is from the main checkout, not regenerated
- `railway.json` - new file pinning `build.builder=DOCKERFILE`, `build.dockerfilePath=Dockerfile`, `deploy.restartPolicyType=ON_FAILURE`
- `README.md` - new "Deploy to Railway" subsection added between "HuggingFace Spaces" and "Local Docker" under `## Deployment`

## Decisions Made
- Shell-form CMD chosen over exec-form so `${PORT:-7860}` expands via `/bin/sh -c` at container start; exec-form JSON arrays do not perform env-var expansion
- No Railway Volume configured: `chroma_db` is read-only at query time (only `indexer.py` writes it, and it's baked into the image at build), so the immutable image itself is sufficient persistence
- `railway.json` omits `startCommand` — the Dockerfile's own CMD already handles the dynamic port, no override needed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Copied chroma_db into the worktree before staging (Task 2)**
- **Found during:** Task 2 (Track the pre-indexed chroma_db)
- **Issue:** This execution runs in a git worktree. `chroma_db/` was gitignored and untracked in the shared checkout, so `git worktree add` did not carry it into this worktree's working directory — `chroma_db/` was absent on disk here, even though the plan's reference facts state it exists (~4.3MB, established during planning against the main checkout).
- **Fix:** Copied `chroma_db/` (chroma.sqlite3 + the UUID segment directory) from the main checkout (`Projet CV - RAG/chroma_db`) into this worktree, unmodified, before running `git add chroma_db`. No re-indexing, no content change.
- **Files modified:** chroma_db/ (added, not edited)
- **Verification:** `git ls-files chroma_db` lists all 5 files including `chroma.sqlite3`; verification command from the plan passes (`OK`)
- **Committed in:** 19268e0 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — worktree isolation gap, not a plan defect)
**Impact on plan:** No scope creep; this was purely a mechanical step to get the same on-disk chroma_db (already established as present and read-only in the plan's context) into the isolated worktree so the plan's own instructions ("stage the directory with `git add chroma_db`") could execute as written.

## Issues Encountered
None beyond the worktree chroma_db copy noted above.

## User Setup Required

**External service requires manual configuration.** Per the plan's `<manual_user_steps>`, the following are NOT executed by this task and remain for the user, now documented in README.md's "Deploy to Railway" section:
1. `git push` the commits from this task to GitHub so Railway sees the adapted Dockerfile + chroma_db + railway.json
2. In the already-created Railway project: add a service from the GitHub repo (auto-detects Dockerfile) OR `railway link` + `railway up` from the repo root
3. Set the two Variables/secrets: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`
4. Generate a public domain (`railway domain` or "Generate Domain" in the dashboard) for the QR code
5. Verify the deployed URL loads the Chainlit UI and answers a sample recruiter question

## Next Phase Readiness
- Repo is Railway-deploy-ready: Dockerfile, chroma_db, and railway.json are all in place and committed
- HuggingFace Spaces deployment is unaffected — no changes to `app.py`, `rag.py`, `indexer.py`, `requirements.txt`, or the HF front-matter/`app_port`
- Blocked only on the user's manual Railway account steps (push, link/deploy, set secrets, generate domain) listed above

---
*Quick task: 260714-bje*
*Completed: 2026-07-14*

## Self-Check: PASSED

- FOUND: Dockerfile
- FOUND: railway.json
- FOUND: README.md
- FOUND: .gitignore
- FOUND: chroma_db/chroma.sqlite3
- FOUND: commit 5976195
- FOUND: commit 19268e0
- FOUND: commit ee22853
