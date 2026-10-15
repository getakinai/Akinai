import type { ReactNode } from 'react'
import { CATEGORIES } from './_categories'

const SLOTS = ['home.hero', 'home.after_first_rail', 'home.footer', 'checkout.payment']

const LAYOUT = `plugins/trust_badges/
  manifest.ts        key, name, category, slots
  plugin.ts          definePlugin(...)
  server/            routes, controllers, services
  migrations/        picked up automatically
  client/index.tsx   storefront slot component
  tests/             unit/ and functional/`

const MANIFEST = `const manifest = {
  key: 'trust_badges',
  name: 'Trust badges',
  description: 'Badges under the home page hero.',
  category: 'storefront',
  slots: ['home.after_first_rail'],
  defaultInstalled: false,
  adminRoute: 'admin.trust_badges.home',
} as const satisfies PluginManifest`

const DEFINITION = `export default definePlugin({
  manifest,
  routes: { admin, storefront },
})

// every route in server/routes.ts
router
  .get('trust-badges', [TrustBadgesController])
  .use(middleware.plugin({ key: 'trust_badges' }))`

const code = 'rounded bg-paper px-1 py-0.5 font-mono text-[12px] text-ink'

function Code({ children }: { children: ReactNode }) {
  return <code className={code}>{children}</code>
}

function Block({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-line bg-paper p-3 font-mono text-[11.5px] leading-relaxed text-ink">
      {children}
    </pre>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 text-[14px] font-semibold text-ink">
        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-ink text-[11px] text-paper">
          {n}
        </span>
        {title}
      </h3>
      <div className="flex flex-col gap-2 text-[13px] text-pretty text-muted">{children}</div>
    </section>
  )
}

/** Developer notes for building a bundled plugin, from docs/creating-a-plugin.md. */
export default function PluginDevGuide() {
  return (
    <div className="flex flex-col gap-6">
      <Step n={1} title="Create the folder">
        <p>
          Each plugin is a folder under <Code>plugins/</Code>, found automatically at boot. The
          folder name must equal <Code>manifest.key</Code>.
        </p>
        <Block>{LAYOUT}</Block>
      </Step>

      <Step n={2} title="Write the manifest">
        <Block>{MANIFEST}</Block>
        <p>
          <Code>defaultInstalled</Code> makes it count as installed until staff uninstall it.{' '}
          <Code>adminRoute</Code> is where the Configure button leads.
        </p>
      </Step>

      <Step n={3} title="Define the plugin">
        <Block>{DEFINITION}</Block>
        <p>
          Guard every route with <Code>middleware.plugin</Code> so it returns 404 while the plugin
          is uninstalled.
        </p>
      </Step>

      <Step n={4} title="Fill a storefront slot">
        <p>
          <Code>client/index.tsx</Code> exports the component for the slot your manifest declares.
          Allowed slots:
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {SLOTS.map((slot) => (
            <li key={slot}>
              <Code>{slot}</Code>
            </li>
          ))}
        </ul>
      </Step>

      <Step n={5} title="Pick a category">
        <p>Only these categories are allowed:</p>
        <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
          {Object.entries(CATEGORIES).map(([key, info]) => (
            <li key={key} className="flex items-start gap-3 px-3 py-2.5">
              <info.icon size={16} className="mt-0.5 shrink-0 text-ink-2" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-ink">{info.label}</span>
                  <Code>{key}</Code>
                </div>
                <p className="mt-0.5 text-[12.5px]">{info.description}</p>
              </div>
            </li>
          ))}
        </ul>
        <p>
          A new category has to be added to <Code>PLUGIN_CATEGORIES</Code> in{' '}
          <Code>app/constants/plugins.ts</Code> first.
        </p>
      </Step>

      <Step n={6} title="Payment plugins">
        <p>
          The plugin key must equal the payment method code and be listed in{' '}
          <Code>PLUGIN_PAYMENT_METHOD_CODES</Code>. While uninstalled, the method is hidden from
          Payments and checkout.
        </p>
      </Step>

      <Step n={7} title="Rules">
        <ul className="flex list-disc flex-col gap-1 pl-4">
          <li>Core never imports a plugin or names its tables.</li>
          <li>Uninstalling keeps the plugin&apos;s data; installing again restores it.</li>
          <li>
            Before opening a PR, run <Code>yarn typecheck</Code>, <Code>yarn lint:check</Code> and{' '}
            <Code>yarn test</Code>.
          </li>
        </ul>
      </Step>

      <p className="border-t border-line pt-4 text-[12.5px] text-muted">
        The full guide is in <Code>docs/creating-a-plugin.md</Code>.
      </p>
    </div>
  )
}
