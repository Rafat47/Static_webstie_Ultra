// src/utils/hideNetlifyBadge.js

const BADGE_SELECTORS = [
  '[aria-label*="Powered by Netlify" i]',
  '[aria-label*="build your own site" i]',
  "#nl-badge",
  ".nl-wrap",
].join(",");

function hideNetlifyBadge() {
  document.querySelectorAll(BADGE_SELECTORS).forEach((el) => {
    const wrapper = el.closest(".nl-wrap") || el.closest("div") || el;
    wrapper.style.setProperty("display", "none", "important");
  });
}

export function initHideNetlifyBadge() {
  hideNetlifyBadge();

  // Netlify may inject the badge after the app loads, so watch for new nodes
  const observer = new MutationObserver(hideNetlifyBadge);
  observer.observe(document.body, { childList: true, subtree: true });

  return () => observer.disconnect();
}