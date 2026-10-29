import sanitizeHtml from 'sanitize-html'

const componentHtmlOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    'a',
    'button',
    'div',
    'footer',
    'header',
    'image',
    'img',
    'li',
    'nav',
    'p',
    'path',
    'span',
    'svg',
    'ul',
  ],
  allowedAttributes: {
    '*': [
      'aria-label',
      'class',
      'd',
      'data-qa',
      'data-module',
      'fill-rule',
      'focusable',
      'height',
      'href',
      'OnClick',
      'role',
      'src',
      'viewbox',
      'width',
      'xlink:href',
      'xmlns',
    ],
  },
  allowedSchemes: ['https'],
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  enforceHtmlBoundary: true,
}

export function sanitizeComponentHtml(html: string): string {
  return sanitizeHtml(html, componentHtmlOptions)
}
