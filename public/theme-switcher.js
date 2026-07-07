/**
 * POF Gallery Theme Switcher
 *
 * Toggles between:
 * - POF Gallery theme (custom design, body.pof-theme)
 * - Chainlit vanilla theme (native, no class)
 *
 * Dark mode is NOT handled here — it is delegated entirely to Chainlit's
 * native #theme-toggle, which flips a "dark"/"light" class on <html>
 * (confirmed statically against the installed 2.11.1 frontend build).
 * This script only reacts to that class to keep the logo asset in sync.
 */
(function () {
  const STORAGE_KEY_THEME = 'pof-theme-enabled';
  const POF_LOGO = '/public/logo.svg';
  const POF_LOGO_DARK = '/public/logo-dark.svg';

  // Vanilla mode restores Chainlit's OWN default logo/title (not just "no
  // custom styling"). Confirmed against the installed chainlit 2.11.1
  // package:
  // - server.py's GET /logo route globs "public/logo_{theme}.*" first; our
  //   files are named "logo.svg"/"logo-dark.svg" (no _light/_dark suffix)
  //   so they never match that glob, and the route falls through to the
  //   frontend build's own bundled default logo. Hitting /logo?theme=light
  //   or /logo?theme=dark therefore serves Chainlit's true default logo.
  // - server.py templates <title>{config.ui.name}</title> server-side; the
  //   true hardcoded Chainlit default (chainlit/config.py DEFAULT_CONFIG_STR)
  //   is "Assistant".
  const VANILLA_LOGO_LIGHT = '/logo?theme=light';
  const VANILLA_LOGO_DARK = '/logo?theme=dark';
  const VANILLA_TITLE = 'Assistant';

  // Per-message avatars: MessageAvatar (Avatar.tsx) always returns
  // config.ui.default_avatar_file_url FIRST if set, regardless of theme,
  // so vanilla mode needs its own explicit restore. Confirmed the real
  // fallback in the installed chainlit/server.py's GET /avatars/{id} route:
  // "default" resolves to config.ui.name, sanitized, globbed against
  // public/avatars/{name}.* (note the plural subfolder — distinct from our
  // public/avatar.svg) — since no such file exists, it falls through to
  // get_favicon(), i.e. Chainlit's true fallback avatar. Every per-message
  // avatar <img> matches img[alt^="Avatar for"] (confirmed in the frontend
  // bundle: alt={`Avatar for ${author || 'default'}`}).
  const POF_AVATAR = '/public/avatar.svg';
  const VANILLA_AVATAR = '/avatars/default';

  const HEADING_ID = 'pof-welcome-heading';
  const SUBTITLE_ID = 'pof-welcome-subtitle';
  const ROW_ID = 'pof-welcome-row';
  const TOGGLE_ID = 'pof-theme-toggle-btn';

  const HEADING_TEXT = 'Etienne Le Pironnec';
  const SUBTITLE_TEXT = 'Agent conversationnel — RAG ChainLit';

  // Captured once at script init: this is the server-rendered custom title
  // from config.toml's [UI] name (e.g. "Etienne Le Pironnec"). Read
  // dynamically rather than hardcoded so it stays correct if config.toml's
  // name ever changes.
  const CUSTOM_TITLE = document.title;

  // ===== STATE =====

  function isPofEnabled() {
    const stored = localStorage.getItem(STORAGE_KEY_THEME);
    // Default to POF enabled
    return stored === null ? true : stored === 'true';
  }

  function setPofEnabled(enabled) {
    localStorage.setItem(STORAGE_KEY_THEME, enabled ? 'true' : 'false');
  }

  function isDarkMode() {
    // Confirmed mechanism (Task 1): Chainlit toggles a class on <html>.
    return document.documentElement.classList.contains('dark');
  }

  // ===== WELCOME SCREEN TITLE/SUBTITLE INJECTION =====
  // #welcome-screen natively renders {logo}{MessageComposer}{Starters},
  // with .logo (a plain <img class="logo">) as a DIRECT child — confirmed
  // in the installed frontend bundle's WelcomeScreen.tsx. There is no
  // title/subtitle in the real DOM, so we inject them, and per the
  // original design (Chainlit POF.dc.html) the mark + wordmark sit side
  // by side in a flex row, with the subtitle below as a separate sibling.
  //
  // To match that layout we wrap .logo in a new #pof-welcome-row div and
  // append the heading into the same row — REPARENTING the existing .logo
  // node (appendChild moves it, it does not clone/destroy it). The
  // subtitle stays OUTSIDE the row, as a sibling below it.
  //
  // Everything here is guarded by existence checks so repeated reapply()
  // calls are idempotent (no re-wrapping, no duplicate nodes). When
  // WelcomeScreen fully unmounts (a message exists) and later remounts
  // fresh (back to an empty thread), React creates a brand-new unwrapped
  // .logo and our old #pof-welcome-row/#pof-welcome-heading/subtitle are
  // removed along with the old subtree — the next reapply() tick (driven
  // by the MutationObserver) naturally re-wraps the new .logo from
  // scratch, so no special remount handling is needed here.

  function removeInjectedWelcomeText() {
    const row = document.getElementById(ROW_ID);
    if (row) {
      const logo = row.querySelector('.logo');
      if (logo && row.parentNode) {
        // Restore .logo to its original position (direct child of
        // #welcome-screen, where the row currently sits) BEFORE removing
        // the now-empty wrapper — never orphan/destroy the native node.
        row.parentNode.insertBefore(logo, row);
      }
      row.remove();
    }
    const heading = document.getElementById(HEADING_ID);
    if (heading) heading.remove();
    const subtitle = document.getElementById(SUBTITLE_ID);
    if (subtitle) subtitle.remove();
  }

  function injectWelcomeText() {
    const welcome = document.getElementById('welcome-screen');
    if (!welcome) return;

    if (!isPofEnabled()) {
      removeInjectedWelcomeText();
      return;
    }

    const logo = welcome.querySelector('.logo');

    let row = document.getElementById(ROW_ID);
    if (!row && logo) {
      row = document.createElement('div');
      row.id = ROW_ID;
      logo.parentNode.insertBefore(row, logo);
      row.appendChild(logo); // reparent (move), not clone
    }

    let heading = document.getElementById(HEADING_ID);
    if (!heading) {
      heading = document.createElement('div');
      heading.id = HEADING_ID;
      heading.textContent = HEADING_TEXT;
      if (row) {
        row.appendChild(heading);
      } else if (logo && logo.parentNode) {
        logo.parentNode.insertBefore(heading, logo.nextSibling);
      } else {
        welcome.insertBefore(heading, welcome.firstChild);
      }
    } else if (row && heading.parentNode !== row) {
      // Idempotency safeguard: if a previous partial run left heading
      // outside the row, move it back in after the logo.
      row.appendChild(heading);
    }

    if (!document.getElementById(SUBTITLE_ID)) {
      const subtitle = document.createElement('div');
      subtitle.id = SUBTITLE_ID;
      subtitle.textContent = SUBTITLE_TEXT;
      // Subtitle is a sibling BELOW the row (only the mark+wordmark are
      // side-by-side per the design), not inside it.
      const anchor = row || heading;
      anchor.parentNode.insertBefore(subtitle, anchor.nextSibling);
    }
  }

  // ===== LOGO / AVATAR SYNC (POF asset vs Chainlit's own default) =====
  // When POF is enabled, swap the welcome logo to match Chainlit's native
  // dark/light state (logo.svg / logo-dark.svg) — uses img.src update only,
  // does not fight Chainlit's own logo_file_url wiring in config.toml.
  // When POF is disabled, restore Chainlit's TRUE default logo by hitting
  // its own /logo?theme=... route directly (see VANILLA_LOGO_* comment
  // above for why this bypasses our custom logo_file_url).

  function imgSrcMatches(img, desired) {
    try {
      const current = new URL(img.src, window.location.origin);
      const target = new URL(desired, window.location.origin);
      return current.pathname + current.search === target.pathname + target.search;
    } catch (e) {
      return img.src === desired;
    }
  }

  function syncLogo() {
    const dark = isDarkMode();
    const desired = isPofEnabled()
      ? (dark ? POF_LOGO_DARK : POF_LOGO)
      : (dark ? VANILLA_LOGO_DARK : VANILLA_LOGO_LIGHT);

    document.querySelectorAll('#welcome-screen .logo').forEach((img) => {
      if (img.tagName === 'IMG' && !imgSrcMatches(img, desired)) {
        img.src = desired;
      }
    });
  }

  // Per-message avatars mount dynamically (one per assistant message, new
  // ones appear as messages stream in), so this must re-run on every
  // reapply()/observer tick, not just once — guarded the same way as
  // syncLogo() (compare against the desired URL before assigning) so it
  // does not reintroduce a mutation-loop risk.
  function syncAvatars() {
    const desired = isPofEnabled() ? POF_AVATAR : VANILLA_AVATAR;
    document.querySelectorAll('img[alt^="Avatar for"]').forEach((img) => {
      if (img.tagName === 'IMG' && !imgSrcMatches(img, desired)) {
        img.src = desired;
      }
    });
  }

  // ===== TITLE SYNC (custom title vs Chainlit's own default) =====
  // When POF is disabled, restore Chainlit's true hardcoded default title
  // ("Assistant"); when re-enabled, restore the server-rendered custom
  // title captured at script init.

  function syncTitle() {
    const desired = isPofEnabled() ? CUSTOM_TITLE : VANILLA_TITLE;
    if (document.title !== desired) {
      document.title = desired;
    }
  }

  // ===== APPLY THEME =====

  function applyTheme() {
    if (isPofEnabled()) {
      document.body.classList.add('pof-theme');
    } else {
      document.body.classList.remove('pof-theme');
    }
    injectWelcomeText();
    syncLogo();
    syncAvatars();
    syncTitle();
  }

  // ===== TOGGLE BUTTON (Vanilla <-> Personnalise) =====
  // Distinct id from Chainlit's native #theme-toggle (POF-03) — no
  // custom light/dark button is created here.

  function updateToggleButtonLabel(btn) {
    if (isPofEnabled()) {
      btn.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="3" y="3" width="7" height="7"></rect>' +
        '<rect x="14" y="3" width="7" height="7"></rect>' +
        '<rect x="14" y="14" width="7" height="7"></rect>' +
        '<rect x="3" y="14" width="7" height="7"></rect>' +
        '</svg><span>Vanille</span>';
      btn.setAttribute('aria-label', 'Basculer vers Chainlit vanilla');
    } else {
      btn.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 56 56" fill="none">' +
        '<circle cx="28" cy="14" r="7" fill="currentColor"></circle>' +
        '<circle cx="28" cy="42" r="7" fill="currentColor"></circle>' +
        '<circle cx="14" cy="28" r="7" fill="currentColor"></circle>' +
        '<circle cx="42" cy="28" r="7" fill="currentColor"></circle>' +
        '</svg><span>Personnalise</span>';
      btn.setAttribute('aria-label', 'Basculer vers le theme personnalise');
    }
  }

  // Tracks the POF-enabled state last rendered into the toggle button's
  // innerHTML. Without this guard, ensureToggleButton() would rewrite
  // innerHTML on every reapply() tick (setInterval + bodyObserver), and
  // since the button lives inside document.body, each rewrite is itself
  // a childList/subtree mutation that re-triggers bodyObserver -> reapply()
  // -> ensureToggleButton() -> rewrite -> ... — a tight MutationObserver
  // feedback loop that saturates the microtask queue and starves click
  // dispatch for every button on the page (not just this one).
  let lastRenderedToggleState = null;

  function handleToggleClick() {
    setPofEnabled(!isPofEnabled());
    applyTheme();
    const btn = document.getElementById(TOGGLE_ID);
    if (btn) {
      updateToggleButtonLabel(btn);
      lastRenderedToggleState = isPofEnabled();
    }
  }

  function ensureToggleButton() {
    let btn = document.getElementById(TOGGLE_ID);
    if (!btn) {
      btn = document.createElement('button');
      btn.id = TOGGLE_ID;
      btn.type = 'button';
      btn.addEventListener('click', handleToggleClick);
      document.body.appendChild(btn);
      lastRenderedToggleState = null; // force a label render for the new button
    }
    const currentState = isPofEnabled();
    if (lastRenderedToggleState !== currentState) {
      updateToggleButtonLabel(btn);
      lastRenderedToggleState = currentState;
    }
  }

  // ===== REAPPLY AFTER CHAINLIT RE-RENDERS =====

  function reapply() {
    const pofEnabled = isPofEnabled();
    const hasPofClass = document.body.classList.contains('pof-theme');
    if (pofEnabled !== hasPofClass) {
      applyTheme();
    } else {
      injectWelcomeText();
      syncLogo();
    }
    // Runs every tick regardless of the branch above: new per-message
    // avatar <img> elements can mount at any time as messages stream in,
    // guarded internally so this is a no-op once already correct.
    syncAvatars();
    ensureToggleButton();
  }

  // ===== INITIALIZATION =====

  function init() {
    applyTheme();
    ensureToggleButton();

    // Lightweight periodic reapply — cheap existence checks only.
    setInterval(reapply, 500);

    // Watch for Chainlit React re-renders that might drop our nodes.
    const bodyObserver = new MutationObserver(reapply);
    bodyObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Watch <html class="..."> for Chainlit's native dark/light toggle
    // so the logo asset stays in sync with the native mechanism.
    const htmlObserver = new MutationObserver(syncLogo);
    htmlObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
