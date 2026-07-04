---
phase: 260704-pfu-implement-pof-gallery-chainlit-custom-th
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - public/stylesheet.css
  - public/theme-switcher.js
  - .chainlit/config.toml
  - public/logo.svg
  - public/avatar.svg
  - public/logo-dark.svg
autonomous: false
requirements: [POF-01, POF-02, POF-03, POF-04, POF-05]

must_haves:
  truths:
    - "In POF theme, the welcome screen shows the injected title 'Etienne Le Pironnec' and subtitle 'Agent conversationnel — RAG ChainLit' (POF-01)"
    - "Welcome screen (logo, title, subtitle, composer, starter pills) visually matches Chainlit POF.dc.html — colors, typography, spacing, radius (POF-01)"
    - "Starter pills render as teal (#5b8e7d) rounded pills; send button renders as an orange (#f4a259) circle (POF-01)"
    - "User message renders right-aligned on surface background with 18/18/4/18 radius; assistant message uses POF typography (POF-01)"
    - "A visible Vanilla ↔ Personnalisé toggle button switches themes, persists via localStorage, and survives Chainlit React re-renders (POF-02)"
    - "POF dark mode responds to Chainlit's native dark toggle (#theme-toggle) — no duplicate custom light/dark button (POF-03)"
    - "When toggled to Vanilla, all POF styling and injected nodes are removed and the native Chainlit theme is clean (POF-02)"
  artifacts:
    - path: "public/stylesheet.css"
      provides: "POF theme scoped under body.pof-theme targeting real Chainlit 2.11.1 selectors + shadcn HSL variable overrides"
      contains: "#welcome-screen"
    - path: "public/theme-switcher.js"
      provides: "Welcome title/subtitle DOM injection + Vanilla/Custom toggle button + MutationObserver reapplication"
      contains: "pof-welcome-heading"
    - path: ".chainlit/config.toml"
      provides: "custom_css / custom_js / logo / avatar wiring (verified, adjusted only if broken)"
      contains: "custom_css"
    - path: "public/avatar.svg"
      provides: "Four-petal assistant avatar mark matching design"
      contains: "circle"
  key_links:
    - from: "public/stylesheet.css"
      to: "real Chainlit DOM (#welcome-screen, #starters button, #message-composer, #chat-submit, [data-step-type], .ai-message)"
      via: "literal ID / data-attribute / literal-class selectors (NOT wildcard [class*=...])"
      pattern: "#welcome-screen|#starters|#message-composer|data-step-type"
    - from: "public/theme-switcher.js"
      to: "#welcome-screen"
      via: "injects stable nodes #pof-welcome-heading / #pof-welcome-subtitle"
      pattern: "pof-welcome-heading"
    - from: "public/theme-switcher.js toggle (#pof-theme-toggle-btn)"
      to: "body.pof-theme class"
      via: "classList add/remove + localStorage persistence"
      pattern: "pof-theme"
    - from: "public/stylesheet.css dark variants"
      to: "Chainlit native dark signal (confirmed in Task 1)"
      via: "dark-scoped selector overriding POF CSS variables"
      pattern: "dark"
---

<objective>
Reimplement the "POF Gallery" design as a Chainlit custom theme that targets the REAL Chainlit 2.11.1 DOM selectors (confirmed from the official sourcemap), replacing the current v1 that fails because it targets invented wildcard selectors (`[class*="WelcomeScreen"]`, `[class*="composer"]`, `[class*="starter"]`) matching nothing in the live DOM. Add a reliable Vanilla ↔ Personnalisé toggle, and make POF dark mode ride on Chainlit's native dark-mode mechanism instead of a duplicate custom toggle.

Purpose: The recruiter-facing chatbot must render pixel-faithfully to `design-handoff/.../Chainlit POF.dc.html` (cream/teal/orange editorial look), with a stable escape hatch back to vanilla Chainlit.
Output: Rewritten `public/stylesheet.css` and `public/theme-switcher.js`, verified `.chainlit/config.toml` and four-petal SVG assets, and a real in-browser visual verification.

Local requirement map:
- POF-01: Faithful reproduction of welcome + conversation screens (typography, colors, spacing, radius, sizes).
- POF-02: Vanilla ↔ Personnalisé toggle button, always visible, persisted, reliable across React re-renders.
- POF-03: POF dark mode reuses Chainlit's native dark mechanism (no duplicate custom moon/sun toggle).
- POF-04: Real browser visual verification (light + dark, both toggle states, send a test message).
- POF-05: No new runtime dependencies or frameworks — stay within `public/` + `.chainlit/config.toml`.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
# Design source of truth — read in full before writing any code
@design-handoff/chainlit-rag-interface-redesign/project/Chainlit POF.dc.html
@design-handoff/chainlit-rag-interface-redesign/project/uploads/stylesheet.css
@design-handoff/chainlit-rag-interface-redesign/README.md

# Current files to rewrite / verify
@public/stylesheet.css
@public/theme-switcher.js
@.chainlit/config.toml
@public/logo.svg
@public/avatar.svg
@public/logo-dark.svg

# App context (do NOT modify — for selector/starter reference only)
@app.py
</context>

<confirmed_selectors>
Real, stable Chainlit 2.11.1 selectors (from official sourcemap — DO NOT invent wildcards):

- `#welcome-screen` — root of the welcome screen. Natively contains ONLY the logo `<img class="logo">`, then `<MessageComposer>`, then `<Starters>`. There is NATIVELY NO h1/title or subtitle in the DOM — the title and subtitle MUST be injected as stable DOM nodes (`#pof-welcome-heading`, `#pof-welcome-subtitle`) by the JS.
- `.logo` — literal class on the welcome logo `<img>`.
- `#message-composer` — composer container (native classes: `bg-accent dark:bg-card rounded-3xl p-3 px-4 w-full min-h-24 flex flex-col`).
- `#chat-input` — the real textarea.
- `#chat-submit` — send button (native `rounded-full h-8 w-8`); `#stop-button` replaces it during streaming.
- `#starters` — starter pills container. Robust selectors: `#starters button` or `[id^="starter-"]`. Each pill's label is a `<p class="text-sm text-muted-foreground truncate">`.
- `#header` — 60px header (`p-3 flex h-[60px] items-center justify-between`). Contains `#new-chat-button`, `#readme-button`, and the NATIVE `#theme-toggle` (Chainlit's own light/dark/system dropdown). Our custom toggle MUST use a DIFFERENT id (`#pof-theme-toggle-btn`) to avoid colliding with `#theme-toggle`.
- User message: wrapper `[data-step-type="user_message"]`, bubble classes `px-5 py-2.5 relative bg-accent rounded-3xl` (+ `ml-auto`, `max-w-[70%]`).
- Assistant message: wrapper `[data-step-type="assistant_message"]`, body in literal-class `.ai-message`, markdown in literal-class `.message-content`.
- Assistant avatar: shadcn `<Avatar><AvatarImage>` fed by `default_avatar_file_url` (`/public/avatar.svg`) — already configured.
- Message action buttons (copy/regenerate): `div.flex.items-center.flex-wrap` (Tailwind classes — real but less stable).

Palette (light): bg `#fdf8e8`, surface `#f0e6c8`, teal `#5b8e7d` (hover `#4a786a`), orange `#f4a259` (hover `#e8933f`), red `#bc4b51`, yellow `#f4e285`, green `#8cb369`, ink `#2b2b2b`, ink-muted `#8c8270`, hairline `rgba(0,0,0,0.10)`, hairline-soft `rgba(0,0,0,0.06)`. Font everywhere: `Calibri, 'Carlito', 'Segoe UI', sans-serif` (Carlito = open-source Calibri clone; keep the existing Google Fonts @import for Carlito). Radii: 14px composer, 999px pills/round buttons, 18px/18px/4px/18px user bubble. Read the HTML for all dark-mode values and exact per-element sizes — do NOT guess.
</confirmed_selectors>

<tasks>

<task type="auto">
  <name>Task 1: Confirm Chainlit's native dark-mode mechanism (statically, no browser)</name>
  <files>public/stylesheet.css (comment header only in this task)</files>
  <action>
    Determine exactly how Chainlit 2.11.1 applies dark mode so the POF dark variants can hook into the SAME mechanism instead of inventing a second one (POF-03). Do this statically by inspecting the INSTALLED Chainlit frontend build, not a browser: locate the frontend dist via `python -c "import chainlit, os; print(os.path.join(os.path.dirname(chainlit.__file__),'frontend','dist','assets'))"`, then grep the built JS assets there for how the theme provider toggles dark mode — search for `documentElement.classList`, `classList.add`, the literal token `dark`, and `data-theme`. Chainlit uses Tailwind + shadcn, so the overwhelmingly likely mechanism is the `.dark` class added to `<html>` (`document.documentElement`), Tailwind's `darkMode: 'class'` convention; confirm this against the built code rather than assuming. Record the confirmed selector prefix (e.g. `html.dark ...`) as a comment block at the top of `public/stylesheet.css` so Task 2 and future maintainers use the right hook. If (and only if) the build unambiguously shows a different mechanism (e.g. `data-theme="dark"` on `<html>` or a class on `<body>`), record that instead. Do NOT introduce any new dependency (POF-05).
  </action>
  <verify>
    <automated>python -c "import chainlit, os; p=os.path.join(os.path.dirname(chainlit.__file__),'frontend','dist','assets'); import glob; fs=glob.glob(os.path.join(p,'*.js')); import sys; hits=[f for f in fs if ('dark' in open(f,encoding='utf-8',errors='ignore').read())]; print('scanned', len(fs), 'dark-refs-in', len(hits)); sys.exit(0 if hits else 1)"</automated>
  </verify>
  <done>The dark-mode mechanism (class vs attribute, and which element it sits on) is confirmed from the installed build and documented as a comment at the top of public/stylesheet.css; the confirmed dark selector prefix is decided for Task 2.</done>
</task>

<task type="auto">
  <name>Task 2: Rewrite public/stylesheet.css against real selectors</name>
  <files>public/stylesheet.css</files>
  <action>
    Rewrite the file ENTIRELY. Remove every invented wildcard selector (`[class*="WelcomeScreen"]`, `[class*="composer"]`, `[class*="starter"]`, `[class*="Starter"]`, `[class*="user-message"]`, `[class*="assistant-message"]`, the giant `[class*="..."]` background-forcing block, `#theme-toggle-btn`, `#dark-mode-toggle-btn`, etc.). KEEP the two parts of the old file that are actually correct: (a) the Carlito Google Fonts @import, and (b) the shadcn HSL variable overrides (`--background`, `--card`, `--accent`, `--muted`, `--border`, `--primary`, `--input`, `--ring`, etc.) declared under `body.pof-theme` — these are reliable because Chainlit's Tailwind classes (`bg-accent`, `bg-card`, `text-muted-foreground`) read them, so they recolor the composer, bubbles, and pills globally with no per-element targeting.

    Structure: (1) define POF color CSS custom properties on `body.pof-theme` for light, and re-declare them under the dark hook confirmed in Task 1 (e.g. `html.dark body.pof-theme { ... }`); reference those variables in all rules so light/dark stays DRY. (2) Override the shadcn HSL vars under `body.pof-theme` (light) and under the dark hook (dark) so `bg-accent`/`bg-card`/etc. adopt the POF palette. (3) Add TARGETED pixel-perfect rules keyed to the confirmed real selectors from <confirmed_selectors>: `body.pof-theme #welcome-screen` layout; `body.pof-theme #pof-welcome-heading` (52px, weight 700, uppercase, letter-spacing 0.04em, ink) and `body.pof-theme #pof-welcome-subtitle` (11px, letter-spacing 0.20em, uppercase, ink-muted); `body.pof-theme .logo` sizing to match design; `body.pof-theme #message-composer` (surface bg, 1px hairline border, 14px radius); `body.pof-theme #chat-input` + placeholder (Calibri/Carlito, ink / ink-muted); `body.pof-theme #chat-submit` (orange circle, 999px, dark icon, hover `#e8933f`) and give `#stop-button` a compatible treatment; `body.pof-theme #starters button` / `body.pof-theme [id^="starter-"]` (teal pill, 999px, 10px 18px padding, `#fdf8e8` text, hover `#4a786a`) and force the inner `p.text-muted-foreground` label color to the pill text color; `body.pof-theme [data-step-type="user_message"]` bubble (surface bg, hairline-soft border, radius 18px 18px 4px 18px, 20px line-height 1.5, right-aligned) — do NOT fight the native `ml-auto`/`max-w-[70%]`; `body.pof-theme [data-step-type="assistant_message"] .ai-message` / `.message-content` typography (20px, line-height 1.6, ink; first paragraph weight 500 / 22px); the assistant action row `body.pof-theme .flex.items-center.flex-wrap button` (11px uppercase letter-spacing 0.12em, ink-muted, teal on hover). (4) Style `#header` transparent with no bottom border, header links (13px, lowercase, letter-spacing 0.05em); DO NOT hide or break the native `#theme-toggle`, `#new-chat-button`, `#readme-button`. (5) Keep a scoped scrollbar and `::selection` treatment. (6) Ensure EVERYTHING is scoped under `body.pof-theme` so that when the class is absent the vanilla Chainlit theme is untouched (POF-02 clean fallback). Also add `body.pof-theme #pof-welcome-heading`/`#pof-welcome-subtitle` display rules and rely on the JS to remove those nodes in vanilla mode. Provide dark-mode color values from the reference HTML / the old file's dark palette (bg `#1a1814`, surface `#262218`, teal `#6fa593`, ink `#f0e6c8`, ink-muted `#9a8f78`). Do not inline external assets beyond the existing Carlito @import (POF-05).
  </action>
  <verify>
    <automated>grep -q '#welcome-screen' public/stylesheet.css && grep -q '#pof-welcome-heading' public/stylesheet.css && grep -q '#starters' public/stylesheet.css && grep -q 'data-step-type' public/stylesheet.css && grep -q '#message-composer' public/stylesheet.css && grep -q '#chat-submit' public/stylesheet.css && grep -q 'body.pof-theme' public/stylesheet.css && echo GATE_PASS</automated>
  </verify>
  <done>stylesheet.css targets the confirmed real selectors (welcome-screen, starters, message-composer, chat-submit, data-step-type, .ai-message), keeps the shadcn HSL overrides + Carlito @import, has light + native-dark variants, contains no invented wildcard element selectors, and applies nothing when body.pof-theme is absent.</done>
</task>

<task type="auto">
  <name>Task 3: Rewrite public/theme-switcher.js and verify config + SVG assets</name>
  <files>public/theme-switcher.js, .chainlit/config.toml, public/logo.svg, public/avatar.svg, public/logo-dark.svg</files>
  <action>
    Rewrite `public/theme-switcher.js` from scratch as an IIFE with three responsibilities, built on the real selectors:

    (1) INJECT the missing welcome title/subtitle as STABLE DOM nodes (not fragile heuristic search). When `#welcome-screen` exists and POF is enabled, create `<div id="pof-welcome-heading">Etienne Le Pironnec</div>` and `<div id="pof-welcome-subtitle">Agent conversationnel — RAG ChainLit</div>` and insert them relative to `#welcome-screen .logo` (heading immediately after the logo, subtitle after the heading), each guarded by an existence check on its id so re-renders never duplicate them. When POF is disabled, REMOVE both nodes so vanilla is clean. Styling lives in CSS (Task 2) keyed on the ids — keep the JS to structure + text only. Aim to match the design's logo+wordmark arrangement as closely as reliability allows; if wrapping the logo and heading in a flex row risks breaking React reconciliation, prefer the simpler vertical stack (logo → heading → subtitle) — that is acceptable.

    (2) TOGGLE Vanilla ↔ Personnalisé via a single button with id `#pof-theme-toggle-btn` (DISTINCT from native `#theme-toggle` — POF-03). Persist state in localStorage (default: POF enabled). On toggle, add/remove `body.pof-theme` and re-run the apply routine. The button must be visible at all times (position it so it does not overlap the native header controls). Do NOT create any custom light/dark (moon/sun) button — dark mode is delegated entirely to Chainlit's native `#theme-toggle` (POF-03); remove the old `#dark-mode-toggle-btn` and its localStorage key entirely. Update the button label/icon to reflect current state (show "Vanille" affordance when POF active, "Personnalisé" when vanilla active).

    (3) REAPPLY reliably after Chainlit React re-renders: a MutationObserver on document.body plus a light periodic reapply (as the current script does) that re-adds `body.pof-theme` if missing, re-creates `#pof-theme-toggle-btn` if React removed it, and re-injects the heading/subtitle if `#welcome-screen` re-rendered without them. Keep the interval lightweight. Do all logo swapping (POF logo vs default) using the existing `/public/logo.svg` / `/public/logo-dark.svg` assets, but do not fight Chainlit's own logo config.

    Then VERIFY (adjust only if broken): `.chainlit/config.toml` still points `custom_css = "/public/stylesheet.css"`, `custom_js = "/public/theme-switcher.js"`, `logo_file_url = "/public/logo.svg"`, `default_avatar_file_url = "/public/avatar.svg"` — these are already correct, so change nothing unless a path is wrong. Confirm `public/logo.svg`, `public/avatar.svg`, `public/logo-dark.svg` render the four-petal mark (4 teal circles around a bg-colored center) matching lines ~65-71 / ~136-142 of Chainlit POF.dc.html — they already match (light `#5b8e7d`/`#fdf8e8`, dark `#6fa593`), so only tweak if a visual mismatch is found. Introduce no new dependencies (POF-05).
  </action>
  <verify>
    <automated>node --check public/theme-switcher.js && grep -q 'pof-welcome-heading' public/theme-switcher.js && grep -q 'pof-theme-toggle-btn' public/theme-switcher.js && grep -q 'welcome-screen' public/theme-switcher.js && ! grep -q 'dark-mode-toggle-btn' public/theme-switcher.js && grep -q 'custom_js = "/public/theme-switcher.js"' .chainlit/config.toml && echo GATE_PASS</automated>
  </verify>
  <done>theme-switcher.js parses cleanly, injects stable #pof-welcome-heading/#pof-welcome-subtitle nodes into #welcome-screen, provides a persisted #pof-theme-toggle-btn (distinct from native #theme-toggle), reapplies after re-renders, and no longer contains a duplicate dark-mode toggle; config.toml wiring and the four-petal SVGs are confirmed correct.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    Rewritten POF Gallery theme: public/stylesheet.css (real Chainlit 2.11.1 selectors + shadcn HSL overrides), public/theme-switcher.js (injected welcome title/subtitle, Vanilla/Personnalisé toggle, re-render reapplication), delegating dark mode to Chainlit's native #theme-toggle.
  </what-built>
  <how-to-verify>
    1. From the project root run: `chainlit run app.py -w` and open http://localhost:8000.
    2. WELCOME SCREEN (POF on): confirm cream background, the injected title "Etienne Le Pironnec" (large, bold, uppercase) and subtitle "Agent conversationnel — RAG ChainLit", the composer as a surface-colored 14px-radius box with an orange round send button, and the 5 starter questions as teal rounded pills. Compare point-by-point against design-handoff/.../Chainlit POF.dc.html (Screen 1).
    3. CONVERSATION: click a starter or type a question and send it. Confirm the user message is right-aligned on the surface background with the 18/18/4/18 pointed-corner radius, and the assistant reply uses the POF typography with the four-petal avatar (compare to Screen 2).
    4. TOGGLE: click the Vanilla/Personnalisé button — confirm it switches to clean vanilla Chainlit (no leftover POF colors, no injected title), then switch back to Personnalisé; reload the page and confirm the last choice persisted.
    5. DARK MODE: use Chainlit's NATIVE header theme toggle (#theme-toggle, sun/moon) to switch to dark — confirm the POF theme adopts its dark palette (dark bg, lighter teal) and that there is NO second/duplicate custom dark button. Toggle back to light.
    6. Confirm the toggle still works after sending several messages (survives React re-renders).
  </how-to-verify>
  <resume-signal>Type "approved" if the welcome and conversation screens match the design in both light and dark and both toggle states work reliably; otherwise describe the specific mismatches (element, expected vs actual) so they can be fixed.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Chainlit server → browser (custom_js/custom_css) | Custom JS runs in the recruiter's browser and mutates the DOM |
| Browser → Google Fonts CDN | CSS @import fetches the Carlito webfont from fonts.googleapis.com |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-pfu-01 | Tampering | theme-switcher.js DOM injection | mitigate | Injected nodes carry only STATIC hardcoded text ("Etienne Le Pironnec", subtitle) — no user input, no innerHTML from untrusted data; use textContent for the title/subtitle |
| T-pfu-02 | Information disclosure | Google Fonts @import | accept | Public font request, no PII; already present in the existing stylesheet and design source; no new endpoint introduced |
| T-pfu-03 | Denial of service | MutationObserver + periodic reapply | mitigate | Keep the observer scoped and the interval lightweight with existence-guards so it does not thrash the DOM or spin the CPU |
| T-pfu-SC | Tampering | npm/pip/cargo installs | accept | No package installs in this plan (POF-05: no new dependencies) — supply-chain surface unchanged |
</threat_model>

<verification>
- `node --check public/theme-switcher.js` passes (valid JS).
- stylesheet.css contains the confirmed real selectors and no invented wildcard element selectors.
- config.toml still wires custom_css / custom_js / logo / avatar to /public/ assets.
- Human-verify checkpoint: welcome + conversation screens match Chainlit POF.dc.html in light AND dark; Vanilla/Personnalisé toggle works both ways and persists; POF dark mode rides the native #theme-toggle with no duplicate button.
</verification>

<success_criteria>
- POF-01: Welcome and conversation screens render pixel-faithfully to Chainlit POF.dc.html (typography, colors, spacing, radius, sizes), confirmed visually.
- POF-02: A persistent, always-visible Vanilla ↔ Personnalisé toggle works reliably across React re-renders and page reloads; vanilla mode is clean (no residual POF styling / injected nodes).
- POF-03: POF dark mode responds to Chainlit's native #theme-toggle only; no duplicate custom dark toggle exists.
- POF-04: Verified in a real browser (both themes, both toggle states, with a sent test message), not just via lint/syntax.
- POF-05: No new runtime dependencies; changes confined to public/ and .chainlit/config.toml.
</success_criteria>

<output>
Create `.planning/quick/260704-pfu-implement-pof-gallery-chainlit-custom-th/260704-pfu-SUMMARY.md` when done.
</output>
