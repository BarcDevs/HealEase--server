import joi from 'joi'
import { NewUserType } from '../../types/data/UserType'

export const signupSchema = joi.object<NewUserType>({
    firstName: joi.string().alphanum().required(),
    lastName: joi.string().alphanum().required(),
    username: joi.string(),
    email: joi
        .string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
        .required(),
    password: joi.string().alphanum().min(8).required()
})
