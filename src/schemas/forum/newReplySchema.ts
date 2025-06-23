import joi from 'joi'
import { NewReplyType } from '../../types/data/ReplyType'

export const newReplySchema = joi.object<Omit<NewReplyType, 'authorId'>>({
    body: joi.string().required()
})
