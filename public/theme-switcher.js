/**
 * POF Gallery Theme Switcher
 *
 * Toggle between:
 * - POF Gallery theme (custom design)
 * - Chainlit vanilla theme (native)
 *
 * Also supports light/dark mode within POF theme.
 */
(function() {
  const STORAGE_KEY_THEME = 'pof-theme-enabled';
  const STORAGE_KEY_DARK = 'pof-dark-mode';
  const POF_LOGO = '/public/logo.svg';
  const POF_LOGO_DARK = '/public/logo-dark.svg';
  const CHAINLIT_LOGO = 'https://chainlit.io/logo.svg'; // Default Chainlit logo

  // ===== STATE =====

  function isPofEnabled() {
    const stored = localStorage.getItem(STORAGE_KEY_THEME);
    // Default to POF enabled
    return stored === null ? true : stored === 'true';
  }

  function isDarkMode() {
    return localStorage.getItem(STORAGE_KEY_DARK) === 'true';
  }

  function setPofEnabled(enabled) {
    localStorage.setItem(STORAGE_KEY_THEME, enabled ? 'true' : 'false');
  }

  function setDarkMode(dark) {
    localStorage.setItem(STORAGE_KEY_DARK, dark ? 'true' : 'false');
  }

  // ===== APPLY THEME =====

  function applyTheme() {
    const pofEnabled = isPofEnabled();
    const darkMode = isDarkMode();

    if (pofEnabled) {
      document.body.classList.add('pof-theme');
      if (darkMode) {
        document.body.setAttribute('data-theme', 'dark');
      } else {
        document.body.removeAttribute('data-theme');
      }
    } else {
      document.body.classList.remove('pof-theme');
      document.body.removeAttribute('data-theme');
    }

    updateLogo(pofEnabled, darkMode);
    updateTitle(pofEnabled);
    updateButtons();
    applyStarterStyles(pofEnabled);
  }

  // ===== LOGO HANDLING =====

  function updateLogo(pofEnabled, darkMode) {
    let logoUrl;
    if (pofEnabled) {
      logoUrl = darkMode ? POF_LOGO_DARK : POF_LOGO;
    } else {
      logoUrl = CHAINLIT_LOGO;
    }

    // Find and update all logo images
    const logoSelectors = [
      'img[alt*="logo" i]',
      'img[src*="logo"]',
      '[class*="logo"] img',
      '[class*="Logo"] img',
      'header img',
      'img[class*="h-"]' // Chainlit uses h-6, h-8 etc for logo sizing
    ];

    document.querySelectorAll(logoSelectors.join(',')).forEach(img => {
      if (img && !img.closest('#theme-toggle-btn') && !img.closest('#dark-mode-toggle-btn')) {
        img.src = logoUrl + '?t=' + Date.now();
      }
    });
  }

  // ===== TITLE HANDLING =====

  function updateTitle(pofEnabled) {
    // Find the welcome screen title container
    const titleSelectors = [
      'h1.text-2xl',
      '[class*="WelcomeScreen"] h1',
      '[class*="welcome"] h1',
      'h1[class*="font-semibold"]',
      '.text-2xl.font-semibold'
    ];

    document.querySelectorAll(titleSelectors.join(',')).forEach(title => {
      if (pofEnabled) {
        // Inject POF title style
        title.textContent = 'Etienne Le Pironnec';
        title.style.fontFamily = "Calibri, 'Carlito', 'Segoe UI', sans-serif";
        title.style.fontWeight = '700';
        title.style.fontSize = '52px';
        title.style.lineHeight = '1';
        title.style.letterSpacing = '0.04em';
        title.style.textTransform = 'uppercase';
        title.style.whiteSpace = 'nowrap';
      }
    });

    // Also look for container that might hold logo + title
    injectTitleNextToLogo(pofEnabled);
  }

  function injectTitleNextToLogo(pofEnabled) {
    if (!pofEnabled) {
      // Remove injected title if exists
      const injectedTitle = document.getElementById('pof-injected-title');
      if (injectedTitle) {
        injectedTitle.remove();
      }
      return;
    }

    // Check if we already injected
    if (document.getElementById('pof-injected-title')) {
      return;
    }

    // Find logo container in header/welcome area
    const logoContainers = document.querySelectorAll('[class*="logo"], [class*="Logo"], header > div, [class*="flex"][class*="items-center"]');

    logoContainers.forEach(container => {
      const img = container.querySelector('img');
      if (img && (img.src.includes('logo') || img.alt?.toLowerCase().includes('logo'))) {
        // Check if there's already a title nearby
        const existingTitle = container.querySelector('h1, [class*="title"], [class*="Title"]');
        if (!existingTitle && !container.querySelector('#pof-injected-title')) {
          const titleSpan = document.createElement('span');
          titleSpan.id = 'pof-injected-title';
          titleSpan.textContent = 'Etienne Le Pironnec';
          titleSpan.style.cssText = `
            font-family: Calibri, 'Carlito', 'Segoe UI', sans-serif;
            font-weight: 700;
            font-size: 24px;
            line-height: 1;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            white-space: nowrap;
            margin-left: 12px;
            color: inherit;
          `;
          img.parentNode.insertBefore(titleSpan, img.nextSibling);
        }
      }
    });
  }

  // ===== STARTER BUTTONS STYLING =====

  function applyStarterStyles(pofEnabled) {
    if (!pofEnabled) return;

    const darkMode = isDarkMode();
    const bgColor = darkMode ? '#6fa593' : '#5b8e7d';
    const textColor = darkMode ? '#1a1814' : '#fdf8e8';

    // Target all possible starter button selectors
    const starterSelectors = [
      'button[class*="starter"]',
      '[class*="Starter"] button',
      '[class*="starters"] button',
      '[class*="Starters"] button',
      '[class*="suggestion"] button',
      '[class*="Suggestion"] button',
      // Chainlit specific - buttons in the welcome area that are not the main CTA
      '[class*="flex-wrap"] button',
      '[class*="gap-2"] button:not([type="submit"])',
      'button[class*="inline-flex"][class*="rounded-full"]',
      'button[class*="rounded-full"]:not([type="submit"])'
    ];

    document.querySelectorAll(starterSelectors.join(',')).forEach(btn => {
      // Skip toggle buttons
      if (btn.id === 'theme-toggle-btn' || btn.id === 'dark-mode-toggle-btn') return;
      // Skip if it's a submit button
      if (btn.type === 'submit') return;
      // Skip if it's in the composer area
      if (btn.closest('[class*="composer"]') || btn.closest('[class*="Composer"]')) return;

      // Check if it looks like a starter (text content, in welcome area, etc.)
      const text = btn.textContent?.trim() || '';
      if (text.length > 10 && text.length < 100) {
        btn.style.setProperty('background', bgColor, 'important');
        btn.style.setProperty('background-color', bgColor, 'important');
        btn.style.setProperty('color', textColor, 'important');
        btn.style.setProperty('border', '1px solid transparent', 'important');
        btn.style.setProperty('border-radius', '999px', 'important');
        btn.style.setProperty('font-family', "Calibri, 'Carlito', 'Segoe UI', sans-serif", 'important');
        btn.style.setProperty('font-size', '13px', 'important');
        btn.style.setProperty('padding', '10px 18px', 'important');
        btn.style.setProperty('letter-spacing', '0.01em', 'important');
      }
    });
  }

  // ===== TOGGLE FUNCTIONS =====

  function togglePofTheme() {
    const newState = !isPofEnabled();
    setPofEnabled(newState);
    applyTheme();
  }

  function toggleDarkMode() {
    const newState = !isDarkMode();
    setDarkMode(newState);
    applyTheme();
  }

  // ===== CREATE BUTTONS =====

  function createButtons() {
    // Theme toggle button (POF / Vanilla)
    if (!document.getElementById('theme-toggle-btn')) {
      const btn = document.createElement('button');
      btn.id = 'theme-toggle-btn';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Toggle POF theme');
      btn.onclick = togglePofTheme;
      document.body.appendChild(btn);
    }

    // Dark mode toggle (only visible when POF is active)
    if (!document.getElementById('dark-mode-toggle-btn')) {
      const darkBtn = document.createElement('button');
      darkBtn.id = 'dark-mode-toggle-btn';
      darkBtn.type = 'button';
      darkBtn.setAttribute('aria-label', 'Toggle dark mode');
      darkBtn.onclick = toggleDarkMode;
      document.body.appendChild(darkBtn);
    }

    updateButtons();
  }

  function updateButtons() {
    const pofEnabled = isPofEnabled();
    const darkMode = isDarkMode();

    // Theme toggle button
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      if (pofEnabled) {
        themeBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span>Vanilla</span>
        `;
        themeBtn.setAttribute('aria-label', 'Basculer vers Chainlit vanilla');
      } else {
        themeBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="14" r="7" fill="currentColor"></circle>
            <circle cx="28" cy="42" r="7" fill="currentColor"></circle>
            <circle cx="14" cy="28" r="7" fill="currentColor"></circle>
            <circle cx="42" cy="28" r="7" fill="currentColor"></circle>
          </svg>
          <span>POF</span>
        `;
        themeBtn.setAttribute('aria-label', 'Basculer vers POF Gallery');
      }
    }

    // Dark mode button - HIDE when not in POF mode
    const darkBtn = document.getElementById('dark-mode-toggle-btn');
    if (darkBtn) {
      if (pofEnabled) {
        darkBtn.style.display = 'flex';
        if (darkMode) {
          // Show sun icon to switch to light
          darkBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4"></circle>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>
            </svg>
          `;
          darkBtn.setAttribute('aria-label', 'Mode clair');
        } else {
          // Show moon icon to switch to dark
          darkBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          `;
          darkBtn.setAttribute('aria-label', 'Mode sombre');
        }
      } else {
        // HIDE the dark mode button when not in POF theme
        darkBtn.style.display = 'none';
      }
    }
  }

  // ===== INITIALIZATION =====

  function init() {
    applyTheme();
    createButtons();

    // Watch for Chainlit re-renders
    setInterval(() => {
      if (!document.getElementById('theme-toggle-btn') || !document.getElementById('dark-mode-toggle-btn')) {
        createButtons();
      }

      // Ensure theme class is applied
      const pofEnabled = isPofEnabled();
      const hasPofClass = document.body.classList.contains('pof-theme');
      if (pofEnabled !== hasPofClass) {
        applyTheme();
      }

      // Re-apply starter styles (Chainlit might re-render them)
      if (pofEnabled) {
        applyStarterStyles(pofEnabled);
        updateTitle(pofEnabled);
      }
    }, 500);

    // Watch for DOM changes
    const observer = new MutationObserver(() => {
      const pofEnabled = isPofEnabled();
      if (pofEnabled) {
        updateLogo(pofEnabled, isDarkMode());
        applyStarterStyles(pofEnabled);
        updateTitle(pofEnabled);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
