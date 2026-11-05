// Keep the same three navigation links and two actions on every page.
export function updateSharedHeader(html) {
  return html.replace(/<header class="(?:header|portfolio-header)">[\s\S]*?<\/header>/, header =>
    header
      .replace(/<button(?: type="button")? data-(?:portfolio-)?cv>CV<\/button>/, '')
      .replace(/<button class="(?:theme-toggle|portfolio-theme)"[\s\S]*?<\/button>/, '')
  );
}
