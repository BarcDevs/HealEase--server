import joi from 'joi'

export const loginSchema = joi.object<{
    email: string
    password: string
}>({
    email: joi
        .string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
        .required(),
    password: joi.string().alphanum().min(8).required()
})
