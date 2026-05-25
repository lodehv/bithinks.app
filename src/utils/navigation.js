/**
 * Lightweight client-side router utility.
 * Programmatically changes path, dispatches popstate event, and scrolls to top of page.
 */
export const navigateTo = (path) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'instant' });
};
