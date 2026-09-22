import sanitizeHtml from 'sanitize-html'

const componentHtmlOptions: sanitizeHtml.IOptions = {
  allowedTags: ['header', 'footer', 'nav', 'main', 'div', 'span', 'p', 'a', 'button', 'ul', 'ol', 'li', 'strong'],
  allowedAttributes: {
    '*': ['class', 'role', 'aria-*'],
    a: ['href'],
    button: ['type', 'aria-*', 'data-module'],
  },
  allowedSchemes: ['https'],
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  enforceHtmlBoundary: true,
}

export function sanitizeComponentHtml(html: string): string {
  return sanitizeHtml(html, componentHtmlOptions)
}
