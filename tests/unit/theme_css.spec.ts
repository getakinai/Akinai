import { test } from '@japa/runner'
import { settingValueProblem } from '#theme_host/schema'
import { sanitizeThemeCss, themeCssValueProblem } from '#theme_host/theme_css'

test.group('sanitizeThemeCss', () => {
  test('accepts normal CSS', ({ assert }) => {
    const css = '.akinai-css-test { display: none; }\nbody { margin: 0; }'
    const result = sanitizeThemeCss(css)
    assert.isTrue(result.ok)
    if (result.ok) assert.equal(result.css, css)
  })

  test('escapes a closing style tag inside the sheet', ({ assert }) => {
    const result = sanitizeThemeCss('.x { content: "</style>"; }')
    assert.isTrue(result.ok)
    if (result.ok) assert.include(result.css, '<\\/style')
  })

  test('rejects script tags and @import', ({ assert }) => {
    assert.isFalse(sanitizeThemeCss('<script>alert(1)</script>').ok)
    assert.isFalse(sanitizeThemeCss('@import url("https://evil.example/x.css");').ok)
    assert.isFalse(sanitizeThemeCss('a { background: url(javascript:alert(1)); }').ok)
  })
})

test.group('themeCss setting validation', () => {
  test('settingValueProblem accepts valid css settings', ({ assert }) => {
    assert.isNull(
      settingValueProblem({ type: 'css', id: 'custom_css', label: 'Custom CSS' } as any, '')
    )
    assert.isNull(
      settingValueProblem(
        { type: 'css', id: 'custom_css', label: 'Custom CSS' } as any,
        '.foo { color: red; }'
      )
    )
    assert.isString(
      settingValueProblem(
        { type: 'css', id: 'custom_css', label: 'Custom CSS' } as any,
        '@import url("x.css");'
      )
    )
  })

  test('themeCssValueProblem matches settingValueProblem for css', ({ assert }) => {
    assert.isNull(themeCssValueProblem('.bar { padding: 1rem; }'))
    assert.isString(themeCssValueProblem(42))
  })
})
