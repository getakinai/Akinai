import MarketingLayout from '~/layouts/marketing'
import ProseCard, { ProseLead, ProseParagraph } from '~/components/prose_card'

export default function ServerError() {
  return (
    <ProseCard status="500" statusClassName="text-danger">
      <ProseLead>
        <span>Something broke.</span>
        <em>The server hit an unexpected error.</em>
      </ProseLead>
      <ProseParagraph>
        Try again in a moment. If the problem persists, check the server logs for the underlying
        exception.
      </ProseParagraph>
    </ProseCard>
  )
}

ServerError.layout = [MarketingLayout]
