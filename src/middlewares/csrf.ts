import { NextFunction, Request, Response } from 'express'
import Csrf from 'csrf'
import { errorFactory } from '../errors/factory'

const csrfProtection = new Csrf()

export const csrfMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { csrfToken } = req.locals || {}
    const { _csrf } = req.cookies

    const isCSRFValid = csrfProtection.verify(_csrf, csrfToken || '')

    if (!isCSRFValid) {
        throw errorFactory.auth.unauthorized('CSRF token is invalid or missing')
    }

    return next()
}
