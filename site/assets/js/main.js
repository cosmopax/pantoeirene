const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function revealOnScroll() {
  const revealItems = document.querySelectorAll('.reveal');
  if (prefersReduced) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  revealItems.forEach((item) => observer.observe(item));
}

function smoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId.length < 2) return;
      const target = document.querySelector(targetId);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });
}

function setupScrollReveal() {
  const revealItems = document.querySelectorAll('.scroll-reveal');
  if (!revealItems.length) return;
  if (prefersReduced) {
    revealItems.forEach((item) => item.classList.add('revealed'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealItems.forEach((item) => observer.observe(item));
}

function setupTileBackgrounds() {
  document.querySelectorAll('[data-bg]').forEach((node) => {
    const url = node.getAttribute('data-bg');
    if (!url || node.style.backgroundImage) return;
    node.style.backgroundImage = `url('${url}')`;
  });
}

function setupTileTilt() {
  if (prefersReduced) return;
  const tiles = document.querySelectorAll('.profile-row--upper .profile-tile');
  tiles.forEach((tile) => {
    let frame = null;
    const handleMove = (event) => {
      const rect = tile.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const tiltX = (0.5 - y) * 10;
      const tiltY = (x - 0.5) * 12;
      const glowX = `${(x * 100).toFixed(1)}%`;
      const glowY = `${(y * 100).toFixed(1)}%`;
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        tile.style.setProperty('--tile-tilt-x', `${tiltX.toFixed(2)}deg`);
        tile.style.setProperty('--tile-tilt-y', `${tiltY.toFixed(2)}deg`);
        tile.style.setProperty('--glow-x', glowX);
        tile.style.setProperty('--glow-y', glowY);
      });
    };
    const handleLeave = () => {
      if (frame) cancelAnimationFrame(frame);
      tile.style.setProperty('--tile-tilt-x', '0deg');
      tile.style.setProperty('--tile-tilt-y', '0deg');
      tile.style.setProperty('--glow-x', '50%');
      tile.style.setProperty('--glow-y', '25%');
    };
    tile.addEventListener('mousemove', handleMove);
    tile.addEventListener('mouseleave', handleLeave);
  });
}

function setupTileFloat() {
  if (prefersReduced) return;
  const tiles = Array.from(document.querySelectorAll('.profile-tile'));
  if (!tiles.length) return;
  let raf = null;
  const animate = (time) => {
    tiles.forEach((tile, index) => {
      const offset = parseFloat(tile.style.getPropertyValue('--float-offset')) || (index * 0.6);
      if (tile.matches(':hover')) {
        tile.style.setProperty('--float-y', '0px');
        tile.style.setProperty('--float-x', '0px');
        return;
      }
      const tier = tile.dataset.tier || 'lower';
      const amp = tier === 'upper' ? 4.5 : 2.5;
      const ampX = tier === 'upper' ? 3 : 1.8;
      const speed = tier === 'upper' ? 0.0008 : 0.00065;
      const y = Math.sin(time * speed + offset) * amp;
      const x = Math.cos(time * speed + offset) * ampX;
      tile.style.setProperty('--float-y', `${y.toFixed(2)}px`);
      tile.style.setProperty('--float-x', `${x.toFixed(2)}px`);
    });
    raf = requestAnimationFrame(animate);
  };
  const restart = () => {
    if (!raf) {
      raf = requestAnimationFrame(animate);
    }
  };
  const stop = () => {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = null;
    }
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else {
      restart();
    }
  });
  restart();
}

function setupOverlays() {
  const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
  const focusCleanupMap = new WeakMap();
  const focusReturnMap = new WeakMap();
  const burgerToggle = document.querySelector('.burger-toggle');
  if (burgerToggle) {
    burgerToggle.setAttribute('aria-expanded', 'false');
  }

  const getFocusable = (container) => Array.from(container.querySelectorAll(focusableSelector));

  const trapFocus = (container) => {
    const focusables = getFocusable(container);
    if (!focusables.length) {
      return () => {};
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const handler = (event) => {
      if (event.key !== 'Tab') return;
      if (focusables.length === 1) {
        event.preventDefault();
        first.focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    container.addEventListener('keydown', handler);
    return () => container.removeEventListener('keydown', handler);
  };

  const openOverlay = (overlay, trigger) => {
    if (!overlay || overlay.classList.contains('active')) return;
    if (trigger && overlay) {
      const rect = trigger.getBoundingClientRect();
      const originX = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
      const originY = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
      overlay.style.setProperty('--origin-x', `${originX.toFixed(2)}%`);
      overlay.style.setProperty('--origin-y', `${Math.min(originY, 60).toFixed(2)}%`);
    }
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    focusReturnMap.set(overlay, trigger || document.activeElement);
    const cleanup = trapFocus(overlay);
    focusCleanupMap.set(overlay, cleanup);
    const focusables = getFocusable(overlay);
    if (focusables.length) {
      focusables[0].focus({ preventScroll: true });
    } else {
      overlay.setAttribute('tabindex', '-1');
      overlay.focus({ preventScroll: true });
    }
  };

  const closeOverlay = (overlay) => {
    if (!overlay || !overlay.classList.contains('active')) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    const cleanup = focusCleanupMap.get(overlay);
    if (cleanup) cleanup();
    focusCleanupMap.delete(overlay);
    const returnTarget = focusReturnMap.get(overlay);
    focusReturnMap.delete(overlay);
    if (!document.querySelector('.project-overlay.active, .burger-menu-overlay.active')) {
      document.body.style.overflow = '';
    }
    if (returnTarget && typeof returnTarget.focus === 'function') {
      returnTarget.focus({ preventScroll: true });
    }
  };

  window.toggleBurgerMenu = function () {
    const overlay = document.getElementById('burger-menu');
    if (overlay) {
      if (overlay.classList.contains('active')) {
        closeOverlay(overlay);
        if (burgerToggle) burgerToggle.setAttribute('aria-expanded', 'false');
      } else {
        openOverlay(overlay, burgerToggle);
        if (burgerToggle) burgerToggle.setAttribute('aria-expanded', 'true');
      }
    }
  };

  document.querySelectorAll('[data-type="overlay"]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      const overlayId = trigger.getAttribute('data-overlay-id');
      const overlay = document.getElementById(`overlay-${overlayId}`);
      if (overlay) {
        openOverlay(overlay, trigger);
      }
    });
  });

  document.querySelectorAll('[data-close-overlay]').forEach((closer) => {
    closer.addEventListener('click', () => {
      const overlay = closer.closest('.project-overlay');
      if (overlay) {
        closeOverlay(overlay);
      }
    });
  });

  document.querySelectorAll('.project-overlay, .burger-menu-overlay').forEach((overlay) => {
    overlay.addEventListener('pointerdown', (event) => {
      if (overlay.classList.contains('project-overlay')) {
        if (event.target.classList.contains('overlay-backdrop') || event.target === overlay) {
          closeOverlay(overlay);
        }
        return;
      }
      if (event.target === overlay) {
        closeOverlay(overlay);
        if (burgerToggle) burgerToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  const burgerMenu = document.getElementById('burger-menu');
  if (burgerMenu) {
    burgerMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        closeOverlay(burgerMenu);
        if (burgerToggle) burgerToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      document.querySelectorAll('.project-overlay.active, .burger-menu-overlay.active').forEach((overlay) => {
        closeOverlay(overlay);
        if (overlay.id === 'burger-menu' && burgerToggle) {
          burgerToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  });
}

function setupNewsletter() {
  const form = document.querySelector('[data-newsletter-form]');
  if (!form) return;
  const status = form.querySelector('.form-status');
  const body = document.body;
  const mode = body.dataset.newsletterMode || 'local';
  const providerUrl = body.dataset.newsletterUrl || '';
  const setStatus = (message, state) => {
    if (!status) return;
    status.textContent = message;
    if (state) {
      status.dataset.state = state;
    } else {
      status.removeAttribute('data-state');
    }
  };
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (mode !== 'local' && !providerUrl) {
      setStatus('Newsletter endpoint is not configured.', 'error');
      return;
    }
    const emailInput = form.querySelector('input[name="email"]');
    const email = emailInput ? emailInput.value.trim() : '';
    if (!email) {
      setStatus('Please enter a valid email.', 'error');
      return;
    }
    const companyInput = form.querySelector('input[name="company"]');
    const company = companyInput ? companyInput.value.trim() : '';
    const endpoint = mode === 'local' || !providerUrl ? form.getAttribute('action') : providerUrl;
    if (!endpoint) {
      setStatus('Newsletter endpoint is not configured.', 'error');
      return;
    }
    setStatus('Submitting...', 'pending');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email, company })
      });
      const payload = await response.json().catch(() => null);
      const ok = response.ok && (payload === null || typeof payload.ok === 'undefined' || payload.ok);
      if (ok) {
        setStatus('Thanks for subscribing.', 'success');
        form.reset();
      } else {
        setStatus((payload && payload.error) || 'Subscription failed. Please try again.', 'error');
      }
    } catch (error) {
      setStatus('Subscription failed. Please try again.', 'error');
    }
  });
}

function setupContactForm() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  const status = form.querySelector('.form-status');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[name="email"]');
    const messageInput = form.querySelector('textarea[name="message"]');
    const companyInput = form.querySelector('input[name="company"]');
    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const message = messageInput ? messageInput.value.trim() : '';
    const company = companyInput ? companyInput.value.trim() : '';
    if (!name || !email || !message) {
      status.textContent = 'Please complete all required fields.';
      return;
    }
    const endpoint = form.getAttribute('action');
    if (!endpoint) {
      status.textContent = 'Contact endpoint is not configured.';
      return;
    }
    status.textContent = 'Sending...';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ name, email, message, company })
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok && payload.ok) {
        status.textContent = 'Message sent. Thank you.';
        form.reset();
      } else {
        status.textContent = payload.error || 'Message failed. Please try again.';
      }
    } catch (error) {
      status.textContent = 'Message failed. Please try again.';
    }
  });
}


function setupSiteNotice() {
  const body = document.body;
  const noticeText = body.dataset.notice;
  if (!noticeText) return;

  const banner = document.createElement('div');
  banner.className = 'site-notice-banner';
  banner.style.cssText = 'background: #ffb84d; color: #000; padding: 10px; text-align: center; font-weight: bold; position: relative; z-index: 9999;';
  banner.innerHTML = `<span>🚧 ${noticeText}</span><button onclick="this.parentElement.remove()" style="background:none; border:none; color:inherit; font:inherit; cursor:pointer; margin-left:1rem; font-size:1.2em;">&times;</button>`;
  document.body.prepend(banner);
}

function setupRhizome() {
  const container = document.querySelector('.rhizome-container');
  if (!container) return;
  const bioBtn = document.getElementById('bio-theme-btn');
  const technoBtn = document.getElementById('techno-theme-btn');
  
  if (bioBtn && technoBtn) {
    bioBtn.addEventListener('click', () => {
        container.classList.remove('theme-techno');
        container.classList.add('theme-bio');
        bioBtn.classList.add('active');
        technoBtn.classList.remove('active');
    });
    technoBtn.addEventListener('click', () => {
        container.classList.remove('theme-bio');
        container.classList.add('theme-techno');
        technoBtn.classList.add('active');
        bioBtn.classList.remove('active');
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  setupSiteNotice();
  revealOnScroll();
  setupScrollReveal();
  setupTileBackgrounds();
  setupTileTilt();
  setupTileFloat();
  setupOverlays();
  smoothScroll();
  setupNewsletter();
  setupContactForm();
  setupRhizome();
});
