import MarketingLayout from '~/layouts/marketing'
import ProseCard, { ProseLead, ProseParagraph } from '~/components/prose_card'

export default function NotFound() {
  return (
    <ProseCard status="404" statusClassName="text-subtle">
      <ProseLead>
        <span>Not found.</span>
        <em>That route hasn&apos;t been built yet.</em>
      </ProseLead>
      <ProseParagraph>
        The page you tried to reach doesn&apos;t exist. Check the URL or head back home.
      </ProseParagraph>
    </ProseCard>
  )
}

NotFound.layout = [MarketingLayout]
