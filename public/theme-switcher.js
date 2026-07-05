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

  const HEADING_ID = 'pof-welcome-heading';
  const SUBTITLE_ID = 'pof-welcome-subtitle';
  const TOGGLE_ID = 'pof-theme-toggle-btn';

  const HEADING_TEXT = 'Etienne Le Pironnec';
  const SUBTITLE_TEXT = 'Agent conversationnel — RAG ChainLit';

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
  // #welcome-screen natively contains ONLY the logo <img class="logo">,
  // then MessageComposer, then Starters — there is no title/subtitle in
  // the real DOM, so we inject stable nodes guarded by id existence
  // checks so re-renders never duplicate them.

  function removeInjectedWelcomeText() {
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

    let heading = document.getElementById(HEADING_ID);
    if (!heading) {
      heading = document.createElement('div');
      heading.id = HEADING_ID;
      heading.textContent = HEADING_TEXT;
      if (logo && logo.parentNode) {
        logo.parentNode.insertBefore(heading, logo.nextSibling);
      } else {
        welcome.insertBefore(heading, welcome.firstChild);
      }
    }

    if (!document.getElementById(SUBTITLE_ID)) {
      const subtitle = document.createElement('div');
      subtitle.id = SUBTITLE_ID;
      subtitle.textContent = SUBTITLE_TEXT;
      heading.parentNode.insertBefore(subtitle, heading.nextSibling);
    }
  }

  // ===== LOGO LIGHT/DARK SYNC =====
  // Swap the welcome logo asset to match Chainlit's native dark/light
  // state. Uses img.src update only — does not fight Chainlit's own
  // logo_file_url wiring in .chainlit/config.toml.

  function syncLogo() {
    const desired = isDarkMode() ? POF_LOGO_DARK : POF_LOGO;
    const desiredFile = desired.split('/').pop();
    document.querySelectorAll('#welcome-screen .logo').forEach((img) => {
      if (img.tagName === 'IMG' && !img.src.includes(desiredFile)) {
        img.src = desired;
      }
    });
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
