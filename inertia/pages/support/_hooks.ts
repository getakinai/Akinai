import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import { recaptchaHeaders } from '~/lib/recaptcha'
import {
  PublicSupportThreadResponseSchema,
  SupportChatReplyResponseSchema,
  SupportReplySentResponseSchema,
  SupportTicketCreatedResponseSchema,
  type SupportReplyForm,
  type SupportTicketForm,
} from './_types'

export const supportKeys = {
  all: ['support'] as const,
  thread: (token: string) => [...supportKeys.all, 'thread', token] as const,
}

/** One question to the help chat; answers come from the help guides only. */
export async function askSupportChat(question: string) {
  const { data } = await http(`/store/support/chat${toQueryString({ q: question })}`, {
    schema: SupportChatReplyResponseSchema,
  })
  return data
}

export function useAskSupportChat() {
  return useMutation({ mutationFn: askSupportChat })
}

export function useCreateSupportTicket() {
  return useMutation({
    mutationFn: async (payload: SupportTicketForm) => {
      const { data } = await http('/support/tickets', {
        method: 'POST',
        body: payload,
        headers: await recaptchaHeaders('support_ticket_create'),
        schema: SupportTicketCreatedResponseSchema,
      })
      return data
    },
  })
}

export function usePublicSupportThread(token: string) {
  return useQuery({
    queryKey: supportKeys.thread(token),
    queryFn: async () => {
      const { data } = await http(`/store/support/tickets/view/${encodeURIComponent(token)}`, {
        schema: PublicSupportThreadResponseSchema,
      })
      return data
    },
    retry: false,
  })
}

export function useReplyPublicSupportThread(token: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: SupportReplyForm) =>
      http(`/support/tickets/${encodeURIComponent(token)}/messages`, {
        method: 'POST',
        body: payload,
        headers: await recaptchaHeaders('support_ticket_reply'),
        schema: SupportReplySentResponseSchema,
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: supportKeys.thread(token) }),
  })
}
