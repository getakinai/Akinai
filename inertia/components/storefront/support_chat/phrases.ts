/** Name the chat assistant goes by. */
export const AGENT_NAME = 'Patty'

/** What the chat widget itself says (answers come from the server). */
export const chatPhrases = {
  welcome: (firstName: string | null) =>
    firstName ? `Hi ${firstName}! I’m ${AGENT_NAME}.` : `Hi! I’m ${AGENT_NAME}.`,
  welcomeDisclaimer:
    'I can help with orders, payments, delivery and returns. If I get stuck, I’ll pass you on to our team.',
  welcomePrompt: 'What would you like to know?',
  helpedFollowUp: 'Great! Anything else I can help with?',
  notQuite: 'Sorry about that. Could you try asking another way?',
  notQuiteAgain: 'I don’t want to keep you going in circles.',
  offerTeam: 'Want me to pass your question to our team? They reply by email.',
  handoffStart: 'Sure. I’ll ask a few quick questions so our team can get back to you by email.',
  handoffStartKnown: 'Sure. I’ll pass this to our team and they’ll get back to you by email.',
  ask: {
    fullName: 'What’s your full name?',
    mobile: (firstName: string) =>
      firstName
        ? `Thanks, ${firstName}. What’s the best mobile number to reach you?`
        : 'What’s the best mobile number to reach you?',
    email: 'And your email address? That’s where we’ll send our reply.',
    concern: 'Tell me a bit about what you need help with.',
  },
  review: 'Here’s what I’ll send to the team. Check it over, then tap Send.',
  sending: 'Sending…',
  sent: (reference: string) => `All set! Your reference is ${reference}.`,
  sentEmail: (email: string) =>
    `We’ve emailed ${email} a private link to follow this conversation. Our team usually replies within one business day.`,
  sentAccount: 'You can also find it under My account → Support.',
  sendFailed: 'Sorry, I couldn’t send that just now.',
  handoffCancelled: 'No worries! I’m here if anything else comes up.',
  error: 'Sorry, I’m having trouble right now. Please try again in a moment.',
}

export const chipLabels = {
  helped: 'Yes, thanks',
  notQuite: 'Not quite',
  handoff: 'Talk to the team',
  handoffYes: 'Yes, send it to the team',
  cancel: 'I’m all done, thanks',
}
