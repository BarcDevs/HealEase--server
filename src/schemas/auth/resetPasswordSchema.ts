import joi from 'joi'

export const resetPasswordSchema = joi.object<{
    email: string
    newPassword: string
    userOTP: number
}>({
    email: joi
        .string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
        .required(),
    newPassword: joi.string().alphanum().min(8).required(),
    userOTP: joi.number().required()
})
