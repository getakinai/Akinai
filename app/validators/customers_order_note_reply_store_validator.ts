import vine from '@vinejs/vine'

export const customersOrderNoteReplyStoreValidator = vine.create({
  parentId: vine.string().uuid(),
  body: vine.string().trim().minLength(1).maxLength(2000),
})
