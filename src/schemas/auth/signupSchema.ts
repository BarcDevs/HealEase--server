import joi from 'joi'
import { PASSWORD_FORMAT } from './passwordFormat'
import type { NewUserType } from '../../types/data/UserType'

export const signupSchema = joi.object<NewUserType>({
    firstName: joi.string().alphanum().required(),
    lastName: joi.string().alphanum().required(),
    username: joi.string(),
    email: joi
        .string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
        .required(),
    password: joi.string().regex(PASSWORD_FORMAT).min(8).required()
})
