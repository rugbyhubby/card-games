// Light / dark theme. 'system' follows the phone's setting; 'light' or 'dark'
// overrides it. The colors themselves are in theme.css.

const BAR = { light: '#ffffff', dark: '#18181a' };

export function applyTheme(theme = 'system') {
  const root = document.documentElement;
  if (theme === 'light' || theme === 'dark') root.dataset.theme = theme;
  else delete root.dataset.theme;

  // Keep the phone's status bar color in step with the page.
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    if (!meta.dataset.media) meta.dataset.media = meta.getAttribute('media') || '';
    if (theme === 'light' || theme === 'dark') { meta.removeAttribute('media'); meta.content = BAR[theme]; }
    else {
      const media = meta.dataset.media;
      if (media) meta.setAttribute('media', media);
      meta.content = media.includes('dark') ? BAR.dark : BAR.light;
    }
  }
}
