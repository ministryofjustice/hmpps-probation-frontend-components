import { sanitizeComponentHtml } from './sanitizeHtml'

describe('sanitizeComponentHtml', () => {
  it('preserves permitted component markup', () => {
    const html =
      '<header class="app-header" role="banner">' +
      '<nav aria-label="Primary navigation">' +
      '<a href="https://example.com">Home</a>' +
      '</nav>' +
      '</header>'

    expect(sanitizeComponentHtml(html)).toBe(html)
  })

  it.each([
    ['script elements', '<header>Safe<script>alert("xss")</script></header>', '<header>Safe</header>'],
    ['object elements', '<object data="https://attacker.example">Fallback content</object>', 'Fallback content'],
    ['embed elements', '<embed src="https://attacker.example/payload">', ''],
    ['style elements', '<style>body { display: none; }</style>', ''],
    ['inline event handlers', '<button onclick="alert(\'xss\')">Open</button>', '<button>Open</button>'],
    ['onerror attributes', '<div onerror="alert(\'xss\')">Content</div>', '<div>Content</div>'],
    ['onload attributes', '<div onload="alert(\'xss\')">Content</div>', '<div>Content</div>'],
    ['style attributes', '<div style="background:url(javascript:alert(1))">Content</div>', '<div>Content</div>'],
    ['iframe elements', '<iframe src="https://attacker.example"></iframe>', ''],
  ])('sanitizes %s', (_description, html, expected) => {
    expect(sanitizeComponentHtml(html)).toBe(expected)
  })

  it.each([
    // eslint-disable-next-line no-script-url -- Intentional XSS payload used to test URL sanitization
    'javascript:alert(document.domain)',
    'data:text/html,<script>alert(document.domain)</script>',
    '//attacker.example/payload',
    'http://attacker.example/payload',
  ])('removes an unsafe link using %s', href => {
    const sanitized = sanitizeComponentHtml(`<a href="${href}">Open link</a>`)

    expect(sanitized).toBe('<a>Open link</a>')
  })

  it('allows HTTPS links', () => {
    const html = '<a href="https://probation.service.justice.gov.uk">Probation</a>'

    expect(sanitizeComponentHtml(html)).toBe(html)
  })

  it('does not allow attribute-name casing to bypass sanitization', () => {
    const sanitized = sanitizeComponentHtml('<button OnClick="alert(1)">Open</button>')

    expect(sanitized).toBe('<button>Open</button>')
  })

  it('handles malformed malicious markup', () => {
    expect(sanitizeComponentHtml('<header><img src="x" onerror=alert(1)><p>Content</p></header>')).toBe(
      '<header><img src="x" /><p>Content</p></header>',
    )
  })
})
