---
phase: 260714-bje-railway-deploy
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - Dockerfile
  - .gitignore
  - chroma_db/
  - railway.json
  - README.md
autonomous: true
requirements:
  - DEPLOY-RAILWAY-01   # Dockerfile binds Railway's dynamic $PORT (HF Spaces still 7860)
  - DEPLOY-RAILWAY-02   # Pre-indexed chroma_db present in Railway build context
  - DEPLOY-RAILWAY-03   # railway.json + README document env vars and manual deploy steps

user_setup:
  - service: railway
    why: "Deploy the CV Chatbot container on the user's already-created Railway project. These steps require the user's own Railway account/CLI session — the executor cannot perform them."
    env_vars:
      - name: ANTHROPIC_API_KEY
        source: "Railway project -> Variables (set as a service variable/secret). Same key already used on HF Spaces."
      - name: OPENAI_API_KEY
        source: "Railway project -> Variables (set as a service variable/secret). Required for embeddings at query time."
    dashboard_config:
      - task: "Deploy via GitHub link: New/Existing Project -> Add service -> Deploy from GitHub repo -> select Etiozor/RAG_CV_Etienne -> Railway auto-detects the Dockerfile -> add the two Variables -> Generate Domain"
        location: "Railway dashboard"
      - task: "OR deploy via CLI from the repo root: `railway login`, `railway link` (to the existing project), `railway up`, then `railway variables --set ANTHROPIC_API_KEY=... --set OPENAI_API_KEY=...`, then `railway domain`"
        location: "Local terminal (Railway CLI)"

must_haves:
  truths:
    - "On Railway, the container listens on the port Railway injects via $PORT (not a hardcoded 7860)."
    - "On HuggingFace Spaces, the container still listens on 7860 (unchanged behavior)."
    - "A fresh clone of the GitHub repo contains chroma_db/, so the Docker build's COPY step succeeds on Railway."
    - "The two required secrets (ANTHROPIC_API_KEY, OPENAI_API_KEY) are documented as Railway variables."
  artifacts:
    - "Dockerfile (CMD binds ${PORT:-7860})"
    - "railway.json (DOCKERFILE builder pinned)"
    - "chroma_db/ tracked in git"
    - "README.md (Deploy to Railway section)"
  key_links:
    - "Railway $PORT env var -> chainlit --port ${PORT:-7860} (dynamic binding)"
    - "GitHub repo checkout -> Docker build context -> COPY chroma_db ./chroma_db (must find the DB)"
---

<objective>
Make the existing repo deployable on Railway without breaking the current HuggingFace Spaces deployment.

Three repo-side blockers must be fixed:
1. The Dockerfile CMD hardcodes `--port 7860` in exec form, so it cannot bind Railway's dynamically injected `$PORT`.
2. `chroma_db/` is gitignored and not tracked in git, so Railway (which builds from the GitHub repo, and whose `railway up` respects `.gitignore`) will get an empty build context and the Dockerfile's `COPY chroma_db ./chroma_db` will fail the build.
3. There is no Railway build config and no Railway deployment documentation (env vars, steps).

Purpose: Give the user a second, additive deployment target (Railway) reachable by QR code, while HuggingFace Spaces keeps working exactly as before.
Output: Adapted Dockerfile, committed chroma_db, minimal railway.json, README "Deploy to Railway" section.

Scope guardrail: This is a config/deployment adaptation, NOT a rewrite. Touch only the files listed. Do NOT change app.py, rag.py, indexer.py, requirements.txt, or the HF Spaces front-matter/EXPOSE.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
</execution_context>

<context>
@CLAUDE.md
@Dockerfile
@.gitignore
@README.md

# Reference facts already established during planning (do not re-derive):
# - git remote origin = https://github.com/Etiozor/RAG_CV_Etienne.git (Railway will build from this GitHub repo)
# - `git ls-files | grep chroma` returns nothing -> chroma_db is NOT tracked (gitignored)
# - chroma_db exists on disk (~4.3MB: chroma.sqlite3 + one uuid segment dir) and is used READ-ONLY at query time
# - HF Spaces routes to app_port: 7860 (README front-matter) and does NOT inject a PORT env var
# - Railway injects a PORT env var; the app must listen on 0.0.0.0:$PORT
</context>

<tasks>

<task type="auto">
  <name>Task 1: Bind Railway's dynamic $PORT in the Dockerfile CMD (keep HF Spaces on 7860)</name>
  <files>Dockerfile</files>
  <action>
Replace the final exec-form CMD (the JSON-array form that hardcodes `--port 7860`) with a shell-form CMD so the port env var expands at runtime. The new command runs chainlit headless, binds `--host 0.0.0.0`, and uses `--port ${PORT:-7860}`.

Why shell form: the current exec-form JSON array does NOT perform environment-variable expansion, so `$PORT` would be passed literally. Shell form (`CMD chainlit run ...`) runs through `/bin/sh -c`, which expands `${PORT:-7860}`.

Why `${PORT:-7860}`: Railway injects `PORT`, so on Railway it binds Railway's assigned port. HuggingFace Spaces does NOT set `PORT`, so it falls back to 7860 — HF behavior is unchanged.

Keep `EXPOSE 7860` as-is (HF Spaces routing hint; Railway ignores EXPOSE and uses the port the app binds to). Keep the `-h` headless flag and `--host 0.0.0.0`. Update the CMD comment block to state that the port is dynamic: Railway injects PORT, HF Spaces falls back to 7860. Do NOT change any COPY/RUN/ENV/USER/WORKDIR lines.
  </action>
  <verify>
    <automated>grep -F 'PORT:-7860' Dockerfile && grep -Eq '^CMD chainlit run app.py' Dockerfile && ! grep -Eq '^CMD \[' Dockerfile && grep -q 'EXPOSE 7860' Dockerfile && echo OK</automated>
  </verify>
  <done>Dockerfile CMD is shell form binding `--host 0.0.0.0 --port ${PORT:-7860}`; no JSON-array CMD remains; `EXPOSE 7860` retained. On Railway the app binds $PORT; on HF Spaces it still binds 7860.</done>
</task>

<task type="auto">
  <name>Task 2: Track the pre-indexed chroma_db so Railway's build context contains it</name>
  <files>.gitignore, chroma_db/</files>
  <action>
Remove the `chroma_db/` ignore line (and its explanatory comment) from `.gitignore`, then stage the directory with `git add chroma_db`.

Why: Railway builds the image from the GitHub repo checkout, and `railway up` (CLI path) also respects `.gitignore`. Because `chroma_db/` is currently gitignored and untracked, a fresh clone / CLI upload would NOT include it, so the Dockerfile's `COPY --chown=user chroma_db ./chroma_db` would fail the Railway build. The whole app design ships a pre-indexed, read-only vector store inside the image, so the DB belongs in the repo.

This is additive and safe for HF Spaces: HF already receives chroma_db in its build context today, so committing it to the shared GitHub repo does not change HF behavior.

Persistence note (no code change): chroma_db is read-only at query time (only indexer.py writes it, and it is baked into the image at build). Therefore Railway needs NO Volume — the DB "persists" as part of the immutable image across restarts/redeploys. A Railway Volume would only be needed for runtime writes, which is out of scope.

Do NOT run `python indexer.py` or regenerate the DB — commit the existing on-disk chroma_db as-is. Do NOT delete the `.env` ignore line or any other `.gitignore` entries.
  </action>
  <verify>
    <automated>test -n "$(git ls-files chroma_db)" && ! grep -Eq '^\s*chroma_db/' .gitignore && git ls-files chroma_db | grep -q 'chroma.sqlite3' && echo OK</automated>
  </verify>
  <done>chroma_db (chroma.sqlite3 + segment files) is tracked by git; `.gitignore` no longer ignores it; `.env` and all other ignores remain. A clean checkout now contains chroma_db so the Docker COPY succeeds on Railway.</done>
</task>

<task type="auto">
  <name>Task 3: Add minimal railway.json and document Railway deployment in README</name>
  <files>railway.json, README.md</files>
  <action>
Create `railway.json` at the repo root with the minimal config-as-code that pins the Docker builder so Railway does not fall back to Railpack/Nixpacks auto-detection. Include the `$schema` key (`https://railway.com/railway.schema.json`), a `build` object with `builder` set to DOCKERFILE and `dockerfilePath` set to `Dockerfile`, and a `deploy` object with `restartPolicyType` set to `ON_FAILURE`. Do NOT set a `startCommand` (the Dockerfile CMD already handles $PORT). This file is ignored by HF Spaces, so it is purely additive.

Then add a "Deploy to Railway" subsection under the existing `## Deployment` section in README.md (leave the HuggingFace Spaces and Local Docker subsections untouched). The subsection must document, as steps the USER performs (the executor cannot log into Railway):
- Required Railway Variables/secrets: `ANTHROPIC_API_KEY` and `OPENAI_API_KEY`.
- That the container binds Railway's `$PORT` automatically (no port config needed by the user).
- GitHub path: create/open the Railway project -> Add service -> Deploy from GitHub repo -> select the repo -> Railway auto-detects the Dockerfile -> add the two Variables -> Generate Domain.
- CLI path (from repo root): `railway login`, `railway link` (to the already-created project), `railway up`, `railway variables --set ANTHROPIC_API_KEY=... --set OPENAI_API_KEY=...`, `railway domain`.
- A one-line note that chroma_db is shipped inside the image (pre-indexed, read-only) so no Railway Volume is required.

Keep API keys out of all files — they are set as Railway Variables only, never committed.
  </action>
  <verify>
    <automated>python -c "import json; d=json.load(open('railway.json')); assert d['build']['builder']=='DOCKERFILE' and d['build']['dockerfilePath']=='Dockerfile'; print('json-ok')" && grep -q 'Deploy to Railway' README.md && grep -q 'ANTHROPIC_API_KEY' README.md && grep -q 'OPENAI_API_KEY' README.md && grep -q 'HuggingFace Spaces' README.md && echo OK</automated>
  </verify>
  <done>Valid railway.json pins the DOCKERFILE builder; README has a "Deploy to Railway" subsection listing both secrets, the $PORT note, both deploy paths (GitHub + CLI), and the no-Volume note; the existing HF Spaces + Local Docker subsections are intact.</done>
</task>

</tasks>

<manual_user_steps>
NON-TASK DELIVERABLE — these require the user's own Railway account/CLI session and are NOT executed by the plan. They are documented in README (Task 3) for the user to run after these repo changes are committed and pushed:

1. Push the branch/commit to GitHub (`git push`) so Railway sees the adapted Dockerfile + chroma_db + railway.json.
2. In the already-created Railway project: add a service from the GitHub repo (auto-detects Dockerfile) OR run `railway link` + `railway up` from the repo root.
3. Set the two Variables/secrets: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`.
4. Generate a public domain (`railway domain` or "Generate Domain" in the dashboard) for the QR code.
5. Verify the deployed URL loads the Chainlit UI and answers a sample recruiter question.
</manual_user_steps>

<verification>
- Dockerfile: no JSON-array CMD; shell-form CMD binds `${PORT:-7860}`; `EXPOSE 7860` retained.
- git: `git ls-files chroma_db` is non-empty; `.gitignore` no longer contains `chroma_db/` but still contains `.env`.
- railway.json parses as JSON and pins `builder: DOCKERFILE`, `dockerfilePath: Dockerfile`.
- README: "Deploy to Railway" subsection present with both secrets and both deploy paths; HF Spaces subsection unchanged.
- Optional (if Docker available locally): `docker build -t cv-chatbot-railway .` completes (proves COPY chroma_db resolves and the image builds).

Security notes:
- No secrets are added to any tracked file; ANTHROPIC_API_KEY / OPENAI_API_KEY live only as Railway Variables (parallel to the existing HF Spaces secrets). Confirm `.env` stays gitignored after Task 2.
- Committing chroma_db ships only pre-indexed embedding vectors (no API keys, no `.env`), consistent with the existing HF Spaces image.
</verification>

<success_criteria>
- The repo builds and runs on Railway using the injected `$PORT`, with chroma_db present in the image.
- HuggingFace Spaces deployment behavior is unchanged (still binds 7860, front-matter/EXPOSE intact).
- The user has clear README steps + the required Variables to complete the Railway deploy themselves.
</success_criteria>

<output>
Create `.planning/quick/260714-bje-deployer-le-rag-cv-chatbot-sur-railway-n/260714-bje-SUMMARY.md` when done.
</output>
