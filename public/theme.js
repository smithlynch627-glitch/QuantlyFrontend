// Applies the saved theme before the app loads, so the page never flashes the wrong colours.
// (A separate file, because the site's Content-Security-Policy does not allow inline scripts.)
try {
  document.documentElement.dataset.theme = localStorage.getItem('quantly.theme') === 'dark' ? 'dark' : 'light';
} catch (e) {
  document.documentElement.dataset.theme = 'light';
}
