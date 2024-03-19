import joi from 'joi'

export const signupSchema = joi.object({
    name: joi.string().alphanum().required(),
    email: joi
        .string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
        .required(),
    password: joi.string().alphanum().min(8).max(16).required(),
})
