/**
 * ============================================================================
 * ISHANT RANA — PORTFOLIO JAVASCRIPT ENGINE (ES6+)
 * Modules: Theme Switcher, Mobile Navigation Drawer, Scroll Spy (IntersectionObserver),
 * Client-Side Accessible Form Validation, Clipboard Utility, Back-to-Top
 * ============================================================================
 */

(() => {
  'use strict';

  /* --------------------------------------------------------------------------
     1. DOM ELEMENT SELECTORS
     -------------------------------------------------------------------------- */
  const DOM = {
    html: document.documentElement,
    body: document.body,
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    mobileNavToggle: document.getElementById('mobile-nav-toggle'),
    mobileNavDrawer: document.getElementById('mobile-nav-drawer'),
    mobileDrawerBackdrop: document.getElementById('mobile-drawer-backdrop'),
    mobileDrawerClose: document.getElementById('mobile-drawer-close'),
    navLinks: document.querySelectorAll('.nav-link, .mobile-nav-link'),
    desktopNavLinks: document.querySelectorAll('.primary-nav .nav-link'),
    mobileNavLinks: document.querySelectorAll('.mobile-drawer-nav .mobile-nav-link'),
    sections: document.querySelectorAll('section[id]'),
    contactForm: document.getElementById('contact-form'),
    formSuccessBanner: document.getElementById('form-success-banner'),
    contactSubmitBtn: document.getElementById('contact-submit-btn'),
    copyEmailBtn: document.getElementById('copy-email-btn'),
    emailAddressElem: document.getElementById('email-address'),
    backToTopBtn: document.getElementById('back-to-top-btn'),
    currentYearSpan: document.getElementById('current-year')
  };

  /* --------------------------------------------------------------------------
     2. THEME CONTROLLER (localStorage & prefers-color-scheme)
     -------------------------------------------------------------------------- */
  const ThemeController = (() => {
    const STORAGE_KEY = 'ishant_portfolio_theme';
    const THEME_DARK = 'dark';
    const THEME_LIGHT = 'light';

    /**
     * Determine preferred theme based on:
     * 1. localStorage cached setting
     * 2. Operating system prefers-color-scheme
     */
    const getInitialTheme = () => {
      const savedTheme = localStorage.getItem(STORAGE_KEY);
      if (savedTheme === THEME_DARK || savedTheme === THEME_LIGHT) {
        return savedTheme;
      }
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      return prefersLight ? THEME_LIGHT : THEME_DARK;
    };

    /**
     * Apply theme to root <html> element and update ARIA attributes
     * @param {string} theme - 'dark' or 'light'
     */
    const applyTheme = (theme) => {
      DOM.html.setAttribute('data-theme', theme);
      if (DOM.themeToggleBtn) {
        const nextTheme = theme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
        DOM.themeToggleBtn.setAttribute('aria-label', `Switch to ${nextTheme} theme`);
        DOM.themeToggleBtn.setAttribute('title', `Switch to ${nextTheme} theme`);
      }
      // Update browser theme-color meta tag if present
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme === THEME_DARK ? '#070a12' : '#f8fafc');
      }
    };

    /**
     * Toggle between dark and light themes
     */
    const toggleTheme = () => {
      const currentTheme = DOM.html.getAttribute('data-theme') || THEME_DARK;
      const newTheme = currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
      localStorage.setItem(STORAGE_KEY, newTheme);
      applyTheme(newTheme);
    };

    /**
     * Initialize Theme Listeners
     */
    const init = () => {
      const activeTheme = getInitialTheme();
      applyTheme(activeTheme);

      if (DOM.themeToggleBtn) {
        DOM.themeToggleBtn.addEventListener('click', toggleTheme);
      }

      // Listen for system changes if user hasn't explicitly set preference
      if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
          if (!localStorage.getItem(STORAGE_KEY)) {
            applyTheme(e.matches ? THEME_LIGHT : THEME_DARK);
          }
        });
      }
    };

    return { init, toggleTheme };
  })();

  /* --------------------------------------------------------------------------
     3. MOBILE NAVIGATION DRAWER & FOCUS TRAPPING
     -------------------------------------------------------------------------- */
  const MobileDrawer = (() => {
    let previouslyFocusedElement = null;

    const openDrawer = () => {
      if (!DOM.mobileNavDrawer || !DOM.mobileNavToggle) return;
      previouslyFocusedElement = document.activeElement;
      
      DOM.mobileNavDrawer.classList.add('is-open');
      if (DOM.mobileDrawerBackdrop) {
        DOM.mobileDrawerBackdrop.classList.add('is-open');
        DOM.mobileDrawerBackdrop.setAttribute('aria-hidden', 'false');
      }

      DOM.mobileNavDrawer.setAttribute('aria-hidden', 'false');
      DOM.mobileNavToggle.setAttribute('aria-expanded', 'true');
      DOM.body.style.overflow = 'hidden'; // Lock background scroll

      // Focus close button inside drawer for keyboard accessibility
      if (DOM.mobileDrawerClose) {
        DOM.mobileDrawerClose.focus();
      }
    };

    const closeDrawer = () => {
      if (!DOM.mobileNavDrawer || !DOM.mobileNavToggle) return;

      DOM.mobileNavDrawer.classList.remove('is-open');
      if (DOM.mobileDrawerBackdrop) {
        DOM.mobileDrawerBackdrop.classList.remove('is-open');
        DOM.mobileDrawerBackdrop.setAttribute('aria-hidden', 'true');
      }

      DOM.mobileNavDrawer.setAttribute('aria-hidden', 'true');
      DOM.mobileNavToggle.setAttribute('aria-expanded', 'false');
      DOM.body.style.overflow = ''; // Restore background scroll

      // Restore previous focus
      if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
        previouslyFocusedElement.focus();
      }
    };

    const isDrawerOpen = () => {
      return DOM.mobileNavDrawer && DOM.mobileNavDrawer.classList.contains('is-open');
    };

    /**
     * Trap keyboard focus within mobile drawer when opened
     */
    const handleKeydown = (e) => {
      if (!isDrawerOpen()) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closeDrawer();
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = DOM.mobileNavDrawer.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    const init = () => {
      if (!DOM.mobileNavToggle) return;

      DOM.mobileNavToggle.addEventListener('click', () => {
        if (isDrawerOpen()) {
          closeDrawer();
        } else {
          openDrawer();
        }
      });

      if (DOM.mobileDrawerClose) {
        DOM.mobileDrawerClose.addEventListener('click', closeDrawer);
      }

      if (DOM.mobileDrawerBackdrop) {
        DOM.mobileDrawerBackdrop.addEventListener('click', closeDrawer);
      }

      // Close drawer on any internal nav link click
      DOM.mobileNavLinks.forEach((link) => {
        link.addEventListener('click', closeDrawer);
      });

      document.addEventListener('keydown', handleKeydown);
    };

    return { init, openDrawer, closeDrawer };
  })();

  /* --------------------------------------------------------------------------
     4. ACTIVE NAVIGATION SPY (IntersectionObserver)
     -------------------------------------------------------------------------- */
  const ScrollSpy = (() => {
    const init = () => {
      if (!('IntersectionObserver' in window) || DOM.sections.length === 0) return;

      const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
      };

      const observerCallback = (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const currentId = entry.target.getAttribute('id');
            updateActiveLinks(currentId);
          }
        });
      };

      const observer = new IntersectionObserver(observerCallback, observerOptions);

      DOM.sections.forEach((section) => {
        observer.observe(section);
      });
    };

    const updateActiveLinks = (id) => {
      DOM.navLinks.forEach((link) => {
        const href = link.getAttribute('href');
        if (href === `#${id}`) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        } else {
          link.classList.remove('active');
          link.removeAttribute('aria-current');
        }
      });
    };

    return { init };
  })();

  /* --------------------------------------------------------------------------
     5. CLIENT-SIDE ACCESSIBLE FORM VALIDATION
     -------------------------------------------------------------------------- */
  const ContactFormValidator = (() => {
    const fields = {
      name: {
        elem: document.getElementById('contact-name'),
        errorElem: document.getElementById('name-error'),
        validate: (val) => {
          if (!val.trim()) return 'Name is required.';
          if (val.trim().length < 2) return 'Name must be at least 2 characters.';
          return '';
        }
      },
      email: {
        elem: document.getElementById('contact-email'),
        errorElem: document.getElementById('email-error'),
        validate: (val) => {
          if (!val.trim()) return 'Email address is required.';
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(val.trim())) return 'Please provide a valid email (e.g. name@domain.com).';
          return '';
        }
      },
      subject: {
        elem: document.getElementById('contact-subject'),
        errorElem: document.getElementById('subject-error'),
        validate: (val) => {
          if (!val.trim()) return 'Subject line is required.';
          if (val.trim().length < 4) return 'Subject must be at least 4 characters long.';
          return '';
        }
      },
      message: {
        elem: document.getElementById('contact-message'),
        errorElem: document.getElementById('message-error'),
        validate: (val) => {
          if (!val.trim()) return 'Message content is required.';
          if (val.trim().length < 15) return 'Message must be at least 15 characters to provide sufficient context.';
          return '';
        }
      }
    };

    let hasAttemptedSubmit = false;

    /**
     * Validate an individual form field
     * @param {string} fieldKey - Key of field in `fields` map
     * @returns {boolean} - Valid status
     */
    const validateField = (fieldKey) => {
      const field = fields[fieldKey];
      if (!field || !field.elem) return true;

      const errorMessage = field.validate(field.elem.value);
      if (errorMessage) {
        field.elem.classList.add('is-invalid');
        field.elem.setAttribute('aria-invalid', 'true');
        if (field.errorElem) {
          field.errorElem.textContent = errorMessage;
          field.errorElem.classList.add('has-error');
        }
        return false;
      } else {
        field.elem.classList.remove('is-invalid');
        field.elem.removeAttribute('aria-invalid');
        if (field.errorElem) {
          field.errorElem.textContent = '';
          field.errorElem.classList.remove('has-error');
        }
        return true;
      }
    };

    /**
     * Validate all fields across form
     * @returns {boolean} - Overall form validity
     */
    const validateAll = () => {
      let isFormValid = true;
      let firstInvalidElement = null;

      Object.keys(fields).forEach((key) => {
        const isValid = validateField(key);
        if (!isValid) {
          isFormValid = false;
          if (!firstInvalidElement) {
            firstInvalidElement = fields[key].elem;
          }
        }
      });

      if (!isFormValid && firstInvalidElement) {
        firstInvalidElement.focus();
      }

      return isFormValid;
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      hasAttemptedSubmit = true;

      if (!validateAll()) {
        return;
      }

      // Simulate sending with loading state
      if (DOM.contactSubmitBtn) {
        DOM.contactSubmitBtn.disabled = true;
        const originalBtnText = DOM.contactSubmitBtn.querySelector('.btn-text');
        if (originalBtnText) originalBtnText.textContent = 'Transmitting Message...';
      }

      setTimeout(() => {
        // Reset loading state
        if (DOM.contactSubmitBtn) {
          DOM.contactSubmitBtn.disabled = false;
          const originalBtnText = DOM.contactSubmitBtn.querySelector('.btn-text');
          if (originalBtnText) originalBtnText.textContent = 'Transmit Message';
        }

        // Show Success Banner
        if (DOM.formSuccessBanner) {
          DOM.formSuccessBanner.hidden = false;
          DOM.formSuccessBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Reset inputs
        if (DOM.contactForm) {
          DOM.contactForm.reset();
        }

        hasAttemptedSubmit = false;

        // Auto-dismiss banner after 8 seconds
        setTimeout(() => {
          if (DOM.formSuccessBanner) {
            DOM.formSuccessBanner.hidden = true;
          }
        }, 8000);
      }, 750);
    };

    const init = () => {
      if (!DOM.contactForm) return;

      DOM.contactForm.addEventListener('submit', handleSubmit);

      // Real-time validation listeners on input & blur after first submit attempt
      Object.keys(fields).forEach((key) => {
        const field = fields[key];
        if (!field.elem) return;

        field.elem.addEventListener('blur', () => {
          if (hasAttemptedSubmit || field.elem.value.trim().length > 0) {
            validateField(key);
          }
        });

        field.elem.addEventListener('input', () => {
          if (hasAttemptedSubmit) {
            validateField(key);
          }
        });
      });
    };

    return { init };
  })();

  /* --------------------------------------------------------------------------
     6. CLIPBOARD EMAIL COPY UTILITY
     -------------------------------------------------------------------------- */
  const ClipboardHelper = (() => {
    const init = () => {
      if (!DOM.copyEmailBtn || !DOM.emailAddressElem) return;

      DOM.copyEmailBtn.addEventListener('click', async () => {
        const textToCopy = DOM.emailAddressElem.textContent.trim();
        const feedbackElem = DOM.copyEmailBtn.querySelector('.copy-feedback');

        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(textToCopy);
          } else {
            // Fallback for non-secure contexts
            const tempInput = document.createElement('textarea');
            tempInput.value = textToCopy;
            tempInput.style.position = 'fixed';
            tempInput.style.left = '-9999px';
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
          }

          if (feedbackElem) {
            feedbackElem.textContent = 'Copied!';
            DOM.copyEmailBtn.setAttribute('aria-label', 'Email address copied to clipboard');
            setTimeout(() => {
              feedbackElem.textContent = 'Copy';
              DOM.copyEmailBtn.setAttribute('aria-label', 'Copy email address to clipboard');
            }, 2000);
          }
        } catch (err) {
          console.error('Failed to copy text: ', err);
          if (feedbackElem) {
            feedbackElem.textContent = 'Error';
            setTimeout(() => {
              feedbackElem.textContent = 'Copy';
            }, 2000);
          }
        }
      });
    };

    return { init };
  })();

  /* --------------------------------------------------------------------------
     FEATURE 1: INTERACTIVE DEVELOPER TERMINAL MODULE
     -------------------------------------------------------------------------- */
  const InteractiveTerminal = (() => {
    const historyBuffer = [];
    let historyCursor = -1;

    const commands = {
      help: () => {
        return `<div class="term-table">
  <span class="term-table-cmd">about</span><span class="term-table-desc">Brief engineering biography of Ishant Rana</span>
  <span class="term-table-cmd">skills</span><span class="term-table-desc">Core languages, web stack & developer tools</span>
  <span class="term-table-cmd">projects</span><span class="term-table-desc">Featured software, web apps & CLI tools</span>
  <span class="term-table-cmd">contact</span><span class="term-table-desc">Email, LinkedIn & GitHub coordinates</span>
  <span class="term-table-cmd">theme</span><span class="term-table-desc">Toggle between Light & Dark mode</span>
  <span class="term-table-cmd">clear</span><span class="term-table-desc">Wipe terminal history buffer (alias: cls)</span>
</div>`;
      },
      about: () => {
        return `Ishant Rana — B.Tech Computer Science & Engineering Undergraduate.
Specializing in clean code architecture, performance optimization, and algorithmic problem solving with C, C++, and Modern JavaScript (ES6+).`;
      },
      skills: () => {
        return `Languages   : C, C++ (C++17/20), JavaScript (ES6+), SQL
Web Stack   : Semantic HTML5, Modern CSS3 (8px Tokenized Grid), DOM APIs
Core CS     : Data Structures & Algorithms, OOP, Operating Systems, Networks
Tooling     : Git, GitHub, VS Code, Linux/Bash, Chrome DevTools`;
      },
      projects: () => {
        return `[1] AlgoVisualizer  : Interactive Graph & Sorting Engine (Canvas / DSA)
[2] CodeMetrics     : C++17 Source Complexity & Token Analyzer CLI
[3] TaskFlow Pro    : Offline-First Accessible Productivity Suite (IndexedDB)
[4] DevPulse Engine : Zero-Framework Portfolio Architecture (Lighthouse 100)`;
      },
      contact: () => {
        return `Email    : <a href="mailto:ishant.rana.cse@example.com">ishant.rana.cse@example.com</a>
LinkedIn : <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">linkedin.com/in/ishant-rana</a>
GitHub   : <a href="https://github.com" target="_blank" rel="noopener noreferrer">github.com/ishant-rana</a>`;
      },
      theme: () => {
        ThemeController.toggleTheme();
        const currentTheme = DOM.html.getAttribute('data-theme') || 'dark';
        return `Theme switched to: <span class="term-highlight">${currentTheme.toUpperCase()}</span> mode.`;
      },
      whoami: () => {
        return `guest@ishant-portfolio — Welcome explorer! Type 'help' to navigate.`;
      },
      clear: () => {
        clearTerminal();
        return '';
      },
      cls: () => {
        clearTerminal();
        return '';
      }
    };

    const clearTerminal = () => {
      const historyElem = document.getElementById('terminal-history');
      if (historyElem) {
        historyElem.innerHTML = '';
      }
    };

    const executeCommand = (rawInput) => {
      const trimmed = rawInput.trim();
      const historyElem = document.getElementById('terminal-history');
      const terminalBody = document.getElementById('terminal-body');
      if (!historyElem || !trimmed) return;

      const [cmdKey] = trimmed.toLowerCase().split(' ');

      // Store in command buffer
      historyBuffer.push(trimmed);
      historyCursor = historyBuffer.length;

      let outputHtml = '';
      if (commands[cmdKey]) {
        outputHtml = commands[cmdKey]();
      } else {
        outputHtml = `<span class="term-error">Command not found: '${escapeHtml(trimmed)}'. Type 'help' for available commands.</span>`;
      }

      // If clear/cls was called, it returned empty string and cleared history
      if (cmdKey === 'clear' || cmdKey === 'cls') {
        return;
      }

      // Append entry to DOM
      const entryElem = document.createElement('div');
      entryElem.className = 'term-entry';
      entryElem.innerHTML = `
        <div class="term-log-cmd">
          <span class="code-prompt" aria-hidden="true">ishant@portfolio:~$</span>
          <span>${escapeHtml(trimmed)}</span>
        </div>
        <div class="term-log-out">${outputHtml}</div>
      `;
      historyElem.appendChild(entryElem);

      // Auto-scroll to bottom
      if (terminalBody) {
        terminalBody.scrollTop = terminalBody.scrollHeight;
      }
    };

    const escapeHtml = (str) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const init = () => {
      const terminalCard = document.getElementById('interactive-terminal');
      const terminalInput = document.getElementById('terminal-input');
      const terminalChips = document.querySelectorAll('.terminal-chip');

      if (!terminalCard || !terminalInput) return;

      // Click anywhere inside terminal focuses input
      terminalCard.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
          terminalInput.focus();
        }
      });

      // Handle Keydown (Enter, Up, Down, Tab)
      terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const val = terminalInput.value;
          if (val.trim()) {
            executeCommand(val);
          }
          terminalInput.value = '';
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (historyBuffer.length > 0 && historyCursor > 0) {
            historyCursor--;
            terminalInput.value = historyBuffer[historyCursor];
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (historyCursor < historyBuffer.length - 1) {
            historyCursor++;
            terminalInput.value = historyBuffer[historyCursor];
          } else {
            historyCursor = historyBuffer.length;
            terminalInput.value = '';
          }
        } else if (e.key === 'Tab') {
          e.preventDefault();
          const val = terminalInput.value.toLowerCase().trim();
          if (val) {
            const matches = Object.keys(commands).filter((cmd) => cmd.startsWith(val));
            if (matches.length === 1) {
              terminalInput.value = matches[0];
            }
          }
        }
      });

      // Quick Chips Click Listeners
      terminalChips.forEach((chip) => {
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          const cmd = chip.getAttribute('data-cmd');
          if (cmd) {
            terminalInput.value = cmd;
            executeCommand(cmd);
            terminalInput.value = '';
            terminalInput.focus();
          }
        });
      });
    };

    return { init, executeCommand, clearTerminal };
  })();

  /* --------------------------------------------------------------------------
     FEATURE 3: GLOBAL CMD+K COMMAND PALETTE MODULE
     -------------------------------------------------------------------------- */
  const CommandPalette = (() => {
    let previouslyFocusedElem = null;
    let selectedIndex = 0;
    let filteredItems = [];

    const actions = [
      // Sections Navigation
      { id: 'nav-home', title: 'Go to Home / Hero', category: 'Navigation', icon: '🏠', shortcut: '#hero', action: () => scrollToId('hero') },
      { id: 'nav-about', title: 'Go to About & Highlights', category: 'Navigation', icon: '📖', shortcut: '#about', action: () => scrollToId('about') },
      { id: 'nav-skills', title: 'Go to Technical Skills', category: 'Navigation', icon: '⚡', shortcut: '#skills', action: () => scrollToId('skills') },
      { id: 'nav-projects', title: 'Go to Featured Projects', category: 'Navigation', icon: '💻', shortcut: '#projects', action: () => scrollToId('projects') },
      { id: 'nav-hackathons', title: 'Go to Hackathons & Honors', category: 'Navigation', icon: '🏆', shortcut: '#hackathons', action: () => scrollToId('hackathons') },
      { id: 'nav-experience', title: 'Go to Experience & Education', category: 'Navigation', icon: '🎓', shortcut: '#experience', action: () => scrollToId('experience') },
      { id: 'nav-contact', title: 'Go to Contact', category: 'Navigation', icon: '✉️', shortcut: '#contact', action: () => scrollToId('contact') },

      // Quick Commands
      { id: 'act-theme', title: 'Toggle Light / Dark Theme', category: 'Quick Actions', icon: '🌓', shortcut: 'Theme', action: () => ThemeController.toggleTheme() },
      { id: 'act-copy-email', title: 'Copy Email Address', category: 'Quick Actions', icon: '📋', shortcut: 'Clipboard', action: () => {
        if (DOM.copyEmailBtn) DOM.copyEmailBtn.click();
      }},
      { id: 'act-clear-term', title: 'Clear Developer Terminal', category: 'Quick Actions', icon: '🧹', shortcut: 'CLI', action: () => InteractiveTerminal.clearTerminal() },
      { id: 'act-top', title: 'Back to Top', category: 'Quick Actions', icon: '⬆️', shortcut: 'Top', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },

      // External Coordinates
      { id: 'ext-github', title: 'Open GitHub Profile', category: 'External Links', icon: '🐙', shortcut: 'GitHub', action: () => window.open('https://github.com', '_blank') },
      { id: 'ext-linkedin', title: 'Open LinkedIn Profile', category: 'External Links', icon: '💼', shortcut: 'LinkedIn', action: () => window.open('https://linkedin.com', '_blank') }
    ];

    const scrollToId = (id) => {
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    };

    const openPalette = () => {
      const modal = document.getElementById('cmd-palette-modal');
      const backdrop = document.getElementById('cmd-palette-backdrop');
      const input = document.getElementById('cmd-input');
      if (!modal || !backdrop) return;

      previouslyFocusedElem = document.activeElement;
      modal.classList.add('is-open');
      backdrop.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      backdrop.setAttribute('aria-hidden', 'false');
      DOM.body.style.overflow = 'hidden';

      if (input) {
        input.value = '';
        input.focus();
      }

      renderList('');
    };

    const closePalette = () => {
      const modal = document.getElementById('cmd-palette-modal');
      const backdrop = document.getElementById('cmd-palette-backdrop');
      if (!modal || !backdrop) return;

      modal.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      backdrop.setAttribute('aria-hidden', 'true');
      DOM.body.style.overflow = '';

      if (previouslyFocusedElem && typeof previouslyFocusedElem.focus === 'function') {
        previouslyFocusedElem.focus();
      }
    };

    const isOpen = () => {
      const modal = document.getElementById('cmd-palette-modal');
      return modal && modal.classList.contains('is-open');
    };

    const renderList = (filterQuery) => {
      const resultsContainer = document.getElementById('cmd-results-list');
      if (!resultsContainer) return;

      const q = filterQuery.toLowerCase().trim();
      filteredItems = actions.filter((item) => {
        return item.title.toLowerCase().includes(q) ||
               item.category.toLowerCase().includes(q) ||
               item.shortcut.toLowerCase().includes(q);
      });

      selectedIndex = 0;

      if (filteredItems.length === 0) {
        resultsContainer.innerHTML = `<div class="cmd-empty-state">No matching commands found for "${escapeHtml(filterQuery)}"</div>`;
        return;
      }

      const categories = [...new Set(filteredItems.map(item => item.category))];
      let html = '';
      let itemIndex = 0;

      categories.forEach((cat) => {
        html += `<div class="cmd-group"><div class="cmd-group-title">${cat}</div>`;
        const catItems = filteredItems.filter(item => item.category === cat);
        catItems.forEach((item) => {
          const isSelected = itemIndex === selectedIndex;
          html += `
            <div class="cmd-item ${isSelected ? 'is-selected' : ''}" 
                 role="option" 
                 id="cmd-item-${itemIndex}" 
                 data-index="${itemIndex}" 
                 aria-selected="${isSelected}">
              <div class="cmd-item-left">
                <span class="cmd-item-icon" aria-hidden="true">${item.icon}</span>
                <span class="cmd-item-title">${item.title}</span>
              </div>
              <span class="cmd-item-badge">${item.shortcut}</span>
            </div>
          `;
          itemIndex++;
        });
        html += `</div>`;
      });

      resultsContainer.innerHTML = html;

      // Click delegation on results
      const itemElements = resultsContainer.querySelectorAll('.cmd-item');
      itemElements.forEach((el) => {
        el.addEventListener('click', () => {
          const idx = parseInt(el.getAttribute('data-index'), 10);
          executeIndex(idx);
        });
      });
    };

    const updateSelection = (newIdx) => {
      if (filteredItems.length === 0) return;
      if (newIdx < 0) newIdx = filteredItems.length - 1;
      if (newIdx >= filteredItems.length) newIdx = 0;

      selectedIndex = newIdx;

      const resultsContainer = document.getElementById('cmd-results-list');
      if (!resultsContainer) return;

      const allItems = resultsContainer.querySelectorAll('.cmd-item');
      allItems.forEach((el, idx) => {
        if (idx === selectedIndex) {
          el.classList.add('is-selected');
          el.setAttribute('aria-selected', 'true');
          el.scrollIntoView({ block: 'nearest' });
        } else {
          el.classList.remove('is-selected');
          el.setAttribute('aria-selected', 'false');
        }
      });
    };

    const executeIndex = (idx) => {
      if (filteredItems[idx] && typeof filteredItems[idx].action === 'function') {
        const act = filteredItems[idx].action;
        closePalette();
        act();
      }
    };

    const escapeHtml = (str) => {
      return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
      }[tag] || tag));
    };

    const init = () => {
      const triggerBtn = document.getElementById('cmd-k-trigger');
      const backdrop = document.getElementById('cmd-palette-backdrop');
      const escBtn = document.getElementById('cmd-esc-btn');
      const input = document.getElementById('cmd-input');

      // Detect OS for shortcut indicator (Cmd on macOS, Ctrl on Windows/Linux)
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const kbdMod = document.querySelector('.kbd-mod');
      if (kbdMod && !isMac) {
        kbdMod.textContent = 'Ctrl+';
      }

      if (triggerBtn) {
        triggerBtn.addEventListener('click', openPalette);
      }
      if (backdrop) {
        backdrop.addEventListener('click', closePalette);
      }
      if (escBtn) {
        escBtn.addEventListener('click', closePalette);
      }

      if (input) {
        input.addEventListener('input', (e) => {
          renderList(e.target.value);
        });
      }

      // Global Keydown Listener
      document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          if (isOpen()) {
            closePalette();
          } else {
            openPalette();
          }
          return;
        }

        if (isOpen()) {
          if (e.key === 'Escape') {
            e.preventDefault();
            closePalette();
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            updateSelection(selectedIndex + 1);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            updateSelection(selectedIndex - 1);
          } else if (e.key === 'Enter') {
            e.preventDefault();
            executeIndex(selectedIndex);
          }
        }
      });
    };

    return { init, openPalette, closePalette };
  })();

  /* --------------------------------------------------------------------------
     7. BACK-TO-TOP & DYNAMIC YEAR
     -------------------------------------------------------------------------- */
  const GeneralUtilities = (() => {
    const init = () => {
      // Dynamic Footer Year
      if (DOM.currentYearSpan) {
        DOM.currentYearSpan.textContent = new Date().getFullYear();
      }

      // Back to top scroll handler
      if (DOM.backToTopBtn) {
        DOM.backToTopBtn.addEventListener('click', () => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        });
      }
    };

    return { init };
  })();

  /* --------------------------------------------------------------------------
     8. APP INITIALIZATION ON DOMContentLoaded
     -------------------------------------------------------------------------- */
  const initApp = () => {
    ThemeController.init();
    MobileDrawer.init();
    ScrollSpy.init();
    ContactFormValidator.init();
    ClipboardHelper.init();
    InteractiveTerminal.init();
    CommandPalette.init();
    GeneralUtilities.init();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();

