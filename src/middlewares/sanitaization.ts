import { NextFunction, Request, Response } from 'express'
import createDOMPurify from 'dompurify'
import jsdom from 'jsdom'

const { JSDOM } = jsdom

const { window } = new JSDOM('')
const DOMPurify = createDOMPurify(window)

const isBodyEmpty = (req: Request) => Object.keys(req.body).length === 0

const extractCsrfToken = (req: Request) => {
    const { csrfToken } = req.body

    if (csrfToken) {
        // add csrf token to locals
        req.locals = {
            ...req.locals,
            csrfToken
        }

        // remove csrf token from body
        req.body = Object.fromEntries(
            Object.entries(req.body).filter(([key]) => key !== 'csrfToken')
        )
    }
}

export const sanitizeData = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    extractCsrfToken(req)

    if (isBodyEmpty(req)) {
        req.body = null
        return next()
    }

    Object.keys(req.body).forEach((key) => {
        req.body[key] = DOMPurify.sanitize(req.body[key])
    })

    return next()
}
