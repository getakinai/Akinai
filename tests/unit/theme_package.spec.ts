import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { strToU8, zipSync } from 'fflate'
import ThemePackageException from '#exceptions/theme_package_exception'
import { packThemeFolder, readThemePackage, repackTheme } from '#theme_host/package'
import { settingValueProblem } from '#theme_host/schema'

const MINIMAL: Record<string, string> = {
  'theme.json': JSON.stringify({ key: 'minimal', name: 'Minimal', version: '1.0.0' }),
  'layout/theme.edge': '<html><body>{{{ contentForLayout }}}</body></html>',
  'sections/hello.edge': '<p>{{ section.settings.text }}</p>',
  'sections/hello.schema.json': JSON.stringify({
    name: 'Hello',
    settings: [{ type: 'text', id: 'text', label: 'Text', default: 'Hi' }],
  }),
  'templates/index.json': JSON.stringify({
    sections: { hello: { type: 'hello', settings: {} } },
    order: ['hello'],
  }),
}

function zip(files: Record<string, string>) {
  return zipSync(
    Object.fromEntries(Object.entries(files).map(([path, text]) => [path, strToU8(text)]))
  )
}

function problemsOf(files: Record<string, string>): string[] {
  try {
    readThemePackage(zip(files))
  } catch (error) {
    if (error instanceof ThemePackageException) return error.problems
    throw error
  }
  return []
}

test.group('readThemePackage', () => {
  test('accepts the bundled reference theme', async ({ assert }) => {
    const pkg = readThemePackage(await packThemeFolder(app.makePath('themes', 'dawn_lite')))

    assert.equal(pkg.manifest.key, 'dawn_lite')
    assert.includeMembers(Object.keys(pkg.templates), [
      'index',
      'product',
      'collection',
      'page',
      'page.contact',
    ])
    assert.includeMembers(Object.keys(pkg.sectionSchemas), [
      'header',
      'footer',
      'plugin_slot',
      'main_product',
    ])
    assert.deepEqual(pkg.templates.index.sections.banner.blockOrder, ['heading', 'text', 'button'])
    assert.equal(pkg.settingsData.current.page_width, 1200)
  })

  test('accepts a minimal theme and strips a wrapper folder', ({ assert }) => {
    const wrapped = Object.fromEntries(
      Object.entries(MINIMAL).map(([path, text]) => [`minimal/${path}`, text])
    )
    const pkg = readThemePackage(zip(wrapped))

    assert.equal(pkg.manifest.name, 'Minimal')
    assert.deepEqual(pkg.templates.index.order, ['hello'])
    assert.match(pkg.hash, /^[a-f0-9]{64}$/)
  })

  test('requires the core files', ({ assert }) => {
    const problems = problemsOf({ 'theme.json': MINIMAL['theme.json'] })

    assert.include(problems, 'layout/theme.edge is missing')
    assert.include(problems, 'templates/index.json is missing')
  })

  test('rejects anything that is not a zip', ({ assert }) => {
    assert.throws(
      () => readThemePackage(strToU8('not a zip')),
      'The file is not a valid zip archive'
    )
  })

  test('rejects scripts and files outside the theme layout', ({ assert }) => {
    const problems = problemsOf({
      ...MINIMAL,
      'assets/app.js': 'alert(1)',
      'sections/evil.sh': 'rm -rf /',
    })

    assert.include(problems, "assets/app.js: this file type isn't allowed here")
    assert.include(problems, "sections/evil.sh: this file type isn't allowed here")
  })

  test('rejects unsafe Edge code', ({ assert }) => {
    const problems = problemsOf({
      ...MINIMAL,
      'sections/hello.edge': [
        '{{ section.constructor }}',
        "@include('../../resources/views/secret')",
        "@inject({ value: 'x' })",
      ].join('\n'),
    })

    assert.isTrue(problems.some((problem) => problem.includes('"constructor"')))
    assert.isTrue(problems.some((problem) => problem.includes('"../"')))
    assert.isTrue(problems.some((problem) => problem.includes('@inject')))
  })

  test('rejects expressions that build a banned name at runtime', ({ assert }) => {
    const payloads = [
      "{{ ((''['con'+'structor'])['con'+'structor']('return this'))()['pro'+'cess']['version'] }}",
      `{{ ((''['con'+'structor'])['con'+'structor']('return this'))()
        ['pro'+'cess']['getBuiltinModule']('child_'+'pro'+'cess')['execSync']('id').toString() }}`,
      "{{ section['constr'+'uctor'] }}",
      '{{ section[`constructor`] }}',
      "{{ section[`con${'structor'}`] }}",
      '{{ section[block.type] }}',
      '{{ String.fromCharCode(99) }}',
      '{{ process.version }}',
      "{{ Function('return this')() }}",
      '{{ (() => process.version)() }}',
      "{{ (new Function('return process'))() }}",
      '{{ section.\\u0063onstructor }}',
      '{{ globalThis }}',
      '{{ state }}',
      '{{ $context }}',
      '@let({ constructor: c } = section)',
      '@assign(process = 1)',
      '@if(section)\n  @let(process = section)\n@end\n{{ process.version }}',
    ]

    for (const payload of payloads) {
      const problems = problemsOf({
        ...MINIMAL,
        'sections/hello.edge': payload,
      })
      assert.isAbove(problems.length, 0, payload)
    }
  })

  test('allows numeric indexes, helpers, and string concatenation', ({ assert }) => {
    const problems = problemsOf({
      ...MINIMAL,
      'sections/hello.edge': [
        '{{ product.variants[0].price }}',
        "@let(cartProps = { label: t('header.cart') })",
        "{{{ island('cart_button', cartProps, '<a href=\"' + route('home') + '\"></a>') }}}",
      ].join('\n'),
    })

    assert.deepEqual(problems, [])
  })

  test('rejects tags that share a line with other markup', ({ assert }) => {
    const problems = problemsOf({
      ...MINIMAL,
      'sections/hello.edge': [
        '<ul>',
        "  <li>@include('snippets/card')</li>",
        '  <li>Write to hello@include.example</li>',
        '</ul>',
      ].join('\n'),
    })

    assert.deepEqual(problems, [
      'sections/hello.edge line 2: put @include on its own line; Edge prints tags that share a line as text',
    ])
  })

  test('allows banned words in plain text and escaped output', ({ assert }) => {
    const problems = problemsOf({
      ...MINIMAL,
      'sections/hello.edge':
        '<p>Global shipping, the process, and @{{ constructor }}</p>{{-- constructor --}}',
    })

    assert.deepEqual(problems, [])
  })

  test('accepts @app blocks when the section schema allows them', ({ assert }) => {
    const problems = problemsOf({
      ...MINIMAL,
      'sections/apps.edge':
        '@each(block in section.blocks)\n  <div>{{{ appBlock(block.settings) }}}</div>\n@end',
      'sections/apps.schema.json': JSON.stringify({
        name: 'Apps',
        blocks: [{ type: '@app', name: 'App' }],
      }),
      'templates/index.json': JSON.stringify({
        sections: {
          apps: {
            type: 'apps',
            settings: {},
            blocks: {
              hero: {
                type: '@app',
                settings: { plugin: 'hero_slideshow', block: 'hero' },
              },
            },
            block_order: ['hero'],
          },
        },
        order: ['apps'],
      }),
    })

    assert.deepEqual(problems, [])
  })

  test('rejects templates that use unknown sections or bad setting values', ({ assert }) => {
    const problems = problemsOf({
      ...MINIMAL,
      'templates/index.json': JSON.stringify({
        sections: {
          hello: { type: 'hello', settings: { text: 42 } },
          ghost: { type: 'ghost', settings: {} },
        },
        order: ['hello', 'ghost'],
      }),
    })

    assert.isAbove(problems.length, 1)
    assert.isTrue(problems.some((problem) => problem.includes('ghost')))
  })

  test('round-trips settings and templates through repackTheme', ({ assert }) => {
    const pkg = readThemePackage(zip(MINIMAL))
    const templates = {
      index: {
        sections: {
          hello: { type: 'hello', settings: { text: 'Changed' }, blocks: {}, blockOrder: [] },
        },
        order: ['hello'],
      },
    }
    const again = readThemePackage(repackTheme(pkg, { current: {}, sections: {} }, templates))

    assert.equal(again.templates.index.sections.hello.settings.text, 'Changed')
  })
})

test.group('settingValueProblem', () => {
  test('checks values against their setting type', ({ assert }) => {
    const range = { type: 'range', id: 'size', label: 'Size', min: 1, max: 10, step: 1 } as const
    const select = {
      type: 'select',
      id: 'look',
      label: 'Look',
      options: [{ value: 'a', label: 'A' }],
    } as const

    assert.isNull(settingValueProblem(range as any, 5))
    assert.isString(settingValueProblem(range as any, 50))
    assert.isNull(settingValueProblem(select as any, 'a'))
    assert.isString(settingValueProblem(select as any, 'b'))
    assert.isString(settingValueProblem({ type: 'color', id: 'c', label: 'C' } as any, 'red; }'))
    assert.isNull(settingValueProblem({ type: 'checkbox', id: 'x', label: 'X' } as any, true))
  })
})
