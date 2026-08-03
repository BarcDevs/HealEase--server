import { z } from 'zod'

export const updateReplySchema = z.object({
    body: z.string().optional()
})

export type UpdateReplyType = z.infer<typeof updateReplySchema>
