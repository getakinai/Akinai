import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse } from 'acorn'
import { Edge } from 'edge.js'
import { MustacheTypes, TagTypes } from 'edge-lexer'
import type { TagToken, Token } from 'edge-lexer/types'
import { Parser, Stack } from 'edge-parser'

/**
 * Names a theme may read from the state passed by ThemeRenderer.
 * Edge emits any other global (`process`, `Function`, …) as a real binding.
 */
export const THEME_TEMPLATE_ROOTS = new Set([
  'settings',
  'store',
  'menu',
  'policies',
  'market',
  'plugins',
  'template',
  'request',
  'currentYear',
  'designMode',
  'home',
  'product',
  'collection',
  'collectionProducts',
  'page',
  'section',
  'contentForLayout',
  'akinaiHead',
])

/** Functions a theme may call. The callee itself cannot be the result of a call. */
export const THEME_TEMPLATE_HELPERS = new Set([
  'assetUrl',
  'imageUrl',
  'money',
  't',
  'route',
  'pluginSlot',
  'appBlock',
  'island',
  'renderSection',
])

const ALLOWED_TAGS = new Set([
  'if',
  'elseif',
  'else',
  'unless',
  'each',
  'let',
  'assign',
  'include',
  'includeIf',
  'component',
  'slot',
])

/** Property names that reach a function constructor or another object's prototype. */
const BANNED_PROPERTIES = new Set([
  'constructor',
  'prototype',
  '__proto__',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
])

/** Bindings Edge compiles as real parameters, not as template state. */
const RUNTIME_BINDINGS = new Set(['state', '$context', '$filename'])

const BINARY_OPERATORS = new Set(['+', '-', '*', '/', '%', '===', '!==', '>', '>=', '<', '<='])
const LOGICAL_OPERATORS = new Set(['&&', '||', '??'])
const UNARY_OPERATORS = new Set(['!', '+', '-'])

const PARTIAL_PART = '[A-Za-z0-9_-]+(?:\\.[A-Za-z0-9_-]+)*'
const PARTIAL_PATH = new RegExp(
  `^(?:snippets|sections|layout)/(?:${PARTIAL_PART}/)*${PARTIAL_PART}$`
)

type AstNode = {
  type: string
  name?: string
  value?: unknown
  regex?: unknown
  bigint?: string
  operator?: string
  computed?: boolean
  optional?: boolean
  method?: boolean
  kind?: string
  expression?: AstNode
  object?: AstNode
  property?: AstNode
  callee?: AstNode
  arguments?: AstNode[]
  left?: AstNode
  right?: AstNode
  argument?: AstNode | null
  expressions?: AstNode[]
  elements?: Array<AstNode | null>
  properties?: AstNode[]
  key?: AstNode
  test?: AstNode
  consequent?: AstNode
  alternate?: AstNode
  declarations?: AstNode[]
  id?: AstNode
  init?: AstNode | null
}

type Check = { ok: true } | { ok: false; label?: string; detail?: string }

const OK: Check = { ok: true }

function deny(label?: string): Check {
  return label ? { ok: false, label } : { ok: false }
}

class Scope {
  constructor(
    private readonly parent: Scope | null,
    private readonly names: Set<string>
  ) {}

  static root() {
    return new Scope(null, new Set())
  }

  child() {
    return new Scope(this, new Set())
  }

  define(name: string) {
    this.names.add(name)
  }

  has(name: string): boolean {
    return this.names.has(name) || (this.parent?.has(name) ?? false)
  }
}

let registeredTags: ConstructorParameters<typeof Parser>[0] | undefined

function edgeTags() {
  registeredTags ??= Edge.create().tags
  return registeredTags
}

function parserFor(filename: string) {
  return new Parser(edgeTags(), new Stack(), {
    async: true,
    escapeCallPath: ['template', 'escape'],
    statePropertyName: 'state',
    filename,
  } as ConstructorParameters<typeof Parser>[2])
}

function parseProgram(source: string): AstNode[] | null {
  try {
    const program = parse(source, {
      ecmaVersion: 2020,
      allowAwaitOutsideFunction: true,
      locations: true,
    }) as { body: AstNode[] }
    return program.body
  } catch {
    return null
  }
}

function parseExpression(source: string): AstNode | null {
  const body = parseProgram(source)
  if (!body || body.length !== 1 || body[0].type !== 'ExpressionStatement' || !body[0].expression) {
    return null
  }
  return body[0].expression
}

function safeBinding(name: string) {
  return (
    /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) &&
    !RUNTIME_BINDINGS.has(name) &&
    !BANNED_PROPERTIES.has(name)
  )
}

function identifierAllowed(name: string, scope: Scope) {
  if (RUNTIME_BINDINGS.has(name) || BANNED_PROPERTIES.has(name)) return false
  if (scope.has(name)) return true
  return THEME_TEMPLATE_ROOTS.has(name) || THEME_TEMPLATE_HELPERS.has(name)
}

function isString(node: AstNode): node is AstNode & { value: string } {
  return node.type === 'Literal' && typeof node.value === 'string' && !node.regex
}

function isIndex(node: AstNode) {
  return (
    node.type === 'Literal' &&
    typeof node.value === 'number' &&
    Number.isInteger(node.value) &&
    node.value >= 0 &&
    node.bigint === undefined &&
    !node.regex
  )
}

function partialDetail(value: string) {
  if (value.includes('..')) return 'paths may not contain "../"'
  if (value.includes('::')) return 'paths may not contain "::"'
  if (!PARTIAL_PATH.test(value)) return "this expression isn't allowed in theme templates"
  return null
}

function problem(filePath: string, check: Check) {
  if (check.ok) return ''
  if (check.detail) return `${filePath}: ${check.detail}`
  if (check.label) return `${filePath}: "${check.label}" isn't allowed in theme templates`
  return `${filePath}: this expression isn't allowed in theme templates`
}

function rejected(filePath: string, check: Check = deny()) {
  return [problem(filePath, check)]
}

function everyNode(nodes: Array<AstNode | null | undefined>, scope: Scope): Check {
  for (const node of nodes) {
    if (!node) return deny()
    const check = allowNode(node, scope)
    if (!check.ok) return check
  }
  return OK
}

function bannedProperty(node: AstNode) {
  if (!node.property) return null
  if (node.computed) {
    return isString(node.property) && BANNED_PROPERTIES.has(node.property.value)
      ? node.property.value
      : null
  }
  return node.property.type === 'Identifier' &&
    node.property.name &&
    BANNED_PROPERTIES.has(node.property.name)
    ? node.property.name
    : null
}

function isDataObject(node: AstNode, scope: Scope): Check {
  if (
    node.type !== 'Identifier' &&
    node.type !== 'MemberExpression' &&
    node.type !== 'CallExpression'
  ) {
    return deny()
  }
  return allowNode(node, scope)
}

function allowMember(node: AstNode, scope: Scope): Check {
  if (node.optional || !node.object || !node.property) return deny()
  const banned = bannedProperty(node)
  if (banned) return deny(banned)
  const object = isDataObject(node.object, scope)
  if (!object.ok) return object
  if (node.computed) return isIndex(node.property) ? OK : deny()
  if (node.property.type !== 'Identifier' || !node.property.name) return deny()
  return OK
}

function allowCall(node: AstNode, scope: Scope): Check {
  if (node.optional || !node.callee || !node.arguments) return deny()
  if (node.arguments.some((argument) => !argument || argument.type === 'SpreadElement'))
    return deny()
  const args = everyNode(node.arguments, scope)
  if (!args.ok) return args
  const callee = node.callee
  if (
    callee.type === 'Identifier' &&
    callee.name &&
    THEME_TEMPLATE_HELPERS.has(callee.name) &&
    !scope.has(callee.name)
  ) {
    return OK
  }
  if (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    !callee.optional &&
    callee.property?.type === 'Identifier' &&
    callee.property.name === 'slice' &&
    callee.object
  ) {
    return isDataObject(callee.object, scope)
  }
  return deny()
}

function allowObject(node: AstNode, scope: Scope): Check {
  if (!node.properties) return deny()
  for (const prop of node.properties) {
    if (
      prop.type !== 'Property' ||
      prop.computed ||
      prop.method ||
      prop.kind !== 'init' ||
      !prop.key ||
      !prop.value
    ) {
      return deny()
    }
    const key =
      prop.key.type === 'Identifier' ? prop.key.name : isString(prop.key) ? prop.key.value : null
    if (!key || BANNED_PROPERTIES.has(key)) return deny(key ?? undefined)
    const nested = prop.value
    if (!nested || typeof nested !== 'object' || !('type' in nested)) return deny()
    const value = allowNode(nested as AstNode, scope)
    if (!value.ok) return value
  }
  return OK
}

/**
 * Allow only expression forms a theme needs. Anything else — computed names,
 * functions, globals — is rejected, including when a banned name is built
 * with concatenation or escapes and never appears as a literal word.
 */
function allowNode(node: AstNode, scope: Scope): Check {
  switch (node.type) {
    case 'Literal':
      if (node.regex || node.bigint !== undefined || typeof node.value === 'bigint') return deny()
      if (
        node.value === null ||
        typeof node.value === 'string' ||
        typeof node.value === 'number' ||
        typeof node.value === 'boolean'
      ) {
        return OK
      }
      return deny()
    case 'Identifier':
      return node.name && identifierAllowed(node.name, scope) ? OK : deny(node.name)
    case 'MemberExpression':
      return allowMember(node, scope)
    case 'CallExpression':
      return allowCall(node, scope)
    case 'BinaryExpression':
      if (!node.operator || !BINARY_OPERATORS.has(node.operator)) return deny()
      return everyNode([node.left, node.right], scope)
    case 'LogicalExpression':
      if (!node.operator || !LOGICAL_OPERATORS.has(node.operator)) return deny()
      return everyNode([node.left, node.right], scope)
    case 'UnaryExpression':
      if (!node.operator || !UNARY_OPERATORS.has(node.operator)) return deny()
      return everyNode([node.argument], scope)
    case 'ConditionalExpression':
      return everyNode([node.test, node.consequent, node.alternate], scope)
    case 'ArrayExpression':
      return everyNode(node.elements ?? [null], scope)
    case 'ObjectExpression':
      return allowObject(node, scope)
    case 'AwaitExpression':
      if (node.argument?.type !== 'CallExpression') return deny()
      return allowNode(node.argument, scope)
    default:
      return deny()
  }
}

function checkExpression(filePath: string, source: string, scope: Scope) {
  const expression = parseExpression(source)
  if (!expression) return rejected(filePath)
  const check = allowNode(expression, scope)
  return check.ok ? [] : rejected(filePath, check)
}

function checkPartial(filePath: string, source: string) {
  const expression = parseExpression(source)
  if (!expression || !isString(expression)) return rejected(filePath)
  const detail = partialDetail(expression.value)
  return detail ? rejected(filePath, { ok: false, detail }) : []
}

function checkIncludeIf(filePath: string, source: string, scope: Scope) {
  const expression = parseExpression(source)
  if (
    !expression ||
    expression.type !== 'SequenceExpression' ||
    expression.expressions?.length !== 2
  ) {
    return rejected(filePath)
  }
  const [condition, partial] = expression.expressions
  const check = allowNode(condition, scope)
  if (!check.ok) return rejected(filePath, check)
  if (!isString(partial)) return rejected(filePath)
  const detail = partialDetail(partial.value)
  return detail ? rejected(filePath, { ok: false, detail }) : []
}

function checkComponent(filePath: string, source: string, scope: Scope) {
  const expression = parseExpression(source)
  if (!expression) return rejected(filePath)
  if (isString(expression)) {
    const detail = partialDetail(expression.value)
    return detail ? rejected(filePath, { ok: false, detail }) : []
  }
  if (expression.type !== 'SequenceExpression' || expression.expressions?.length !== 2) {
    return rejected(filePath)
  }
  const [name, props] = expression.expressions
  if (!isString(name)) return rejected(filePath)
  const detail = partialDetail(name.value)
  if (detail) return rejected(filePath, { ok: false, detail })
  const check = allowNode(props, scope)
  return check.ok ? [] : rejected(filePath, check)
}

function bindingNames(node: AstNode) {
  if (node.type === 'Identifier' && node.name && safeBinding(node.name)) return [node.name]
  if (node.type === 'SequenceExpression' && node.expressions?.length === 2) {
    const names: string[] = []
    for (const part of node.expressions) {
      if (part.type !== 'Identifier' || !part.name || !safeBinding(part.name)) return null
      names.push(part.name)
    }
    return names
  }
  return null
}

function walkLet(filePath: string, source: string, scope: Scope, problems: string[]) {
  const body = parseProgram(`let ${source}`)
  const declaration = body?.length === 1 ? body[0] : null
  const declarator = declaration?.declarations?.length === 1 ? declaration.declarations[0] : null
  if (
    declaration?.type !== 'VariableDeclaration' ||
    declarator?.id?.type !== 'Identifier' ||
    !declarator.id.name ||
    !safeBinding(declarator.id.name) ||
    !declarator.init
  ) {
    problems.push(...rejected(filePath))
    return
  }
  const check = allowNode(declarator.init, scope)
  if (!check.ok) {
    problems.push(...rejected(filePath, check))
    return
  }
  scope.define(declarator.id.name)
}

function walkAssign(filePath: string, source: string, scope: Scope, problems: string[]) {
  const expression = parseExpression(source)
  if (
    expression?.type !== 'AssignmentExpression' ||
    expression.operator !== '=' ||
    expression.left?.type !== 'Identifier' ||
    !expression.left.name ||
    !scope.has(expression.left.name) ||
    !expression.right
  ) {
    problems.push(...rejected(filePath))
    return
  }
  const check = allowNode(expression.right, scope)
  if (!check.ok) problems.push(...rejected(filePath, check))
}

function walkEach(token: TagToken, scope: Scope, problems: string[], filePath: string) {
  const expression = parseExpression(token.properties.jsArg)
  if (
    expression?.type !== 'BinaryExpression' ||
    expression.operator !== 'in' ||
    !expression.left ||
    !expression.right
  ) {
    problems.push(...rejected(filePath))
    return
  }
  const names = bindingNames(expression.left)
  if (!names) {
    problems.push(...rejected(filePath))
    return
  }
  const check = allowNode(expression.right, scope)
  if (!check.ok) {
    problems.push(...rejected(filePath, check))
    return
  }
  const loop = scope.child()
  for (const name of names) loop.define(name)
  const elseAt = token.children.findIndex(
    (child) => child.type === TagTypes.TAG && child.properties.name === 'else'
  )
  const body = elseAt === -1 ? token.children : token.children.slice(0, elseAt)
  const otherwise = elseAt === -1 ? [] : token.children.slice(elseAt + 1)
  walk(body, loop, false, problems, filePath)
  walk(otherwise, scope, false, problems, filePath)
}

function walkSlot(token: TagToken, scope: Scope, problems: string[], filePath: string) {
  const expression = parseExpression(token.properties.jsArg)
  if (!expression) {
    problems.push(...rejected(filePath))
    return
  }
  if (isString(expression)) {
    walk(token.children, scope, false, problems, filePath)
    return
  }
  if (expression.type !== 'SequenceExpression' || expression.expressions?.length !== 2) {
    problems.push(...rejected(filePath))
    return
  }
  const [name, binding] = expression.expressions
  if (
    !isString(name) ||
    binding.type !== 'Identifier' ||
    !binding.name ||
    !safeBinding(binding.name)
  ) {
    problems.push(...rejected(filePath))
    return
  }
  const inner = scope.child()
  inner.define(binding.name)
  walk(token.children, inner, false, problems, filePath)
}

function walkTag(token: TagToken, scope: Scope, problems: string[], filePath: string) {
  const name = token.properties.name
  if (!ALLOWED_TAGS.has(name)) {
    problems.push(`${filePath}: the @${name} tag isn't allowed in themes`)
    walk(token.children, scope, false, problems, filePath)
    return
  }
  switch (name) {
    case 'else':
      return
    case 'elseif':
      problems.push(...checkExpression(filePath, token.properties.jsArg, scope))
      return
    case 'if':
    case 'unless':
      problems.push(...checkExpression(filePath, token.properties.jsArg, scope))
      walk(token.children, scope, true, problems, filePath)
      return
    case 'each':
      walkEach(token, scope, problems, filePath)
      return
    case 'let':
      walkLet(filePath, token.properties.jsArg, scope, problems)
      return
    case 'assign':
      walkAssign(filePath, token.properties.jsArg, scope, problems)
      return
    case 'include':
      problems.push(...checkPartial(filePath, token.properties.jsArg))
      return
    case 'includeIf':
      problems.push(...checkIncludeIf(filePath, token.properties.jsArg, scope))
      return
    case 'component':
      problems.push(...checkComponent(filePath, token.properties.jsArg, scope))
      walk(token.children, scope, false, problems, filePath)
      return
    case 'slot':
      walkSlot(token, scope, problems, filePath)
      return
    default:
      problems.push(...rejected(filePath))
  }
}

function isBranch(token: Token): token is TagToken {
  return (
    token.type === TagTypes.TAG &&
    (token.properties.name === 'else' || token.properties.name === 'elseif')
  )
}

function walk(
  tokens: Token[],
  scope: Scope,
  branchResets: boolean,
  problems: string[],
  filePath: string
) {
  let branch = scope.child()
  for (const token of tokens) {
    if (token.type === 'raw' || token.type === 'newline' || token.type === 'comment') continue
    if (token.type === MustacheTypes.EMUSTACHE || token.type === MustacheTypes.ESMUSTACHE) continue
    if (token.type === TagTypes.ETAG) {
      walk(token.children, branch, false, problems, filePath)
      continue
    }
    if (token.type === MustacheTypes.MUSTACHE || token.type === MustacheTypes.SMUSTACHE) {
      problems.push(...checkExpression(filePath, token.properties.jsArg, branch))
      continue
    }
    if (token.type !== TagTypes.TAG) {
      problems.push(...rejected(filePath))
      continue
    }
    if (branchResets && isBranch(token)) {
      if (token.properties.name === 'elseif') {
        problems.push(...checkExpression(filePath, token.properties.jsArg, scope))
      }
      branch = scope.child()
      continue
    }
    walkTag(token, branch, problems, filePath)
  }
}

/** Problems in one Edge file. Empty means the file may be compiled. */
export function themeTemplateProblems(filePath: string, source: string): string[] {
  try {
    const tokens = parserFor(filePath).tokenize(source, { filename: filePath })
    const problems: string[] = []
    walk(tokens, Scope.root(), false, problems, filePath)
    return problems
  } catch {
    return [`${filePath}: template could not be parsed`]
  }
}

/** Problems in every `.edge` file under a theme directory, in theme-relative paths. */
export async function themeDirectoryProblems(dir: string): Promise<string[]> {
  const problems: string[] = []
  async function scan(directory: string, prefix: string) {
    const entries = await readdir(directory, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue
      const path = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        await scan(join(directory, entry.name), path)
      } else if (entry.isFile() && entry.name.endsWith('.edge')) {
        const source = await readFile(join(directory, entry.name), 'utf8')
        problems.push(...themeTemplateProblems(path, source))
      }
    }
  }
  await scan(dir, '')
  return problems
}
