import { z } from 'zod'

export const confirmEmailSchema = z.object({
    email: z.email('Email is required'),
    OTP: z.number('OTP is required')
})

export type ConfirmEmailType
    = z.infer<typeof confirmEmailSchema>
