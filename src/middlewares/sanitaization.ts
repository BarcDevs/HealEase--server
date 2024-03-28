import { NextFunction, Request, Response } from 'express'
import createDOMPurify from 'dompurify'
import jsdom from 'jsdom'

const { JSDOM } = jsdom

const { window } = new JSDOM('')
const DOMPurify = createDOMPurify(window)

const isBodyEmpty = (req: Request) => Object.keys(req.body).length === 0

export const sanitizeData = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    if (isBodyEmpty(req)) {
        req.body = null
        return next()
    }

    Object.keys(req.body).forEach((key) => {
        req.body[key] = DOMPurify.sanitize(req.body[key])
    })

    return next()
}
