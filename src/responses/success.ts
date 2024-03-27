import { Response } from 'express'
import { ResponseType } from '../types/ResponseType'
import { HttpStatusCodes } from '../constants/httpStatusCodes'

export const successResponse = <T>(
    res: Response,
    data: T,
    message = 'Action completed successfully',
    status = HttpStatusCodes.OK,
) => {
    const response: ResponseType<T> = {
        message,
        data,
    }
    res.status(status).json(response)
}
