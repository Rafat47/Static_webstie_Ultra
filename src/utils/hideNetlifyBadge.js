// src/utils/hideNetlifyBadge.js

const BADGE_SELECTOR = '[aria-label*="Netlify" i], #nl-badge, .nl-wrap';

// Searches the main document, including shadow roots, for the badge.
function findInRoots(root, selector, found = []) {
  root.querySelectorAll(selector).forEach((el) => found.push(el));
  root.querySelectorAll("*").forEach((el) => {
    if (el.shadowRoot) findInRoots(el.shadowRoot, selector, found);
  });
  return found;
}

function removeNetlifyBadge() {
  const badges = findInRoots(document, BADGE_SELECTOR);

  badges.forEach((el) => {
    let target = el;
    let root = el.getRootNode();

    // If the badge is inside shadow DOM, climb to the outermost host element
    // so the whole injected container is removed, not just the inner button.
    while (root instanceof ShadowRoot) {
      target = root.host;
      root = target.getRootNode();
    }

    // For light DOM badges, remove the wrapper if there is one
    if (target === el) {
      target = el.closest(".nl-wrap") || el;
    }

    target.remove();
  });

  return badges.length;
}

export function initHideNetlifyBadge() {
  removeNetlifyBadge();

  // Remove the badge again if Netlify injects it later
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      removeNetlifyBadge();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // A shadow root can be attached to an existing element without a DOM change,
  // which the observer would miss. Check every second for 30 seconds as a backup.
  const interval = setInterval(removeNetlifyBadge, 1000);
  const stopTimer = setTimeout(() => clearInterval(interval), 30000);

  return () => {
    observer.disconnect();
    clearInterval(interval);
    clearTimeout(stopTimer);
  };
}