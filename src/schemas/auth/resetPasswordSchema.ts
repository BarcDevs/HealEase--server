import joi from 'joi'

export const resetPasswordSchema = joi.object({
    email: joi
        .string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
        .required(),
    newPassword: joi.string().alphanum().min(8).max(16).required(),
    repeatPassword: joi.ref('newPassword'),
    userOTP: joi.number().required(),
})
