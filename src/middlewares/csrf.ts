import { NextFunction, Request, Response } from 'express'
import Csrf from 'csrf'
import { AuthError } from '../errors/AuthError'
import { HttpStatusCodes } from '../constants/httpStatusCodes'

const csrfProtection = new Csrf()

export const csrfMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const { csrfToken } = req.body
    const { _csrf } = req.cookies

    const isCSRFValid = csrfProtection.verify(_csrf, csrfToken)
    if (!isCSRFValid) {
        throw new AuthError(
            'Unauthorized! please login first!',
            undefined,
            'Unauthorized',
            HttpStatusCodes.UNAUTHORIZED,
        )
    }

    return next()
}
