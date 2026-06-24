// Injected immediately after data.jsx and before the UI/screens.
// bridge.js gathers live API data into window.__STRIDE_LIVE; here we override
// the prototype's mock STRIDE_* globals with it, so every screen renders real
// data while keeping the original components 1:1.
if (window.__STRIDE_LIVE) {
  Object.assign(window, window.__STRIDE_LIVE);
}
