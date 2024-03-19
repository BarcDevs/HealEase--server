import { NextFunction, Request, Response } from 'express'
import createDOMPurify from 'dompurify'
import jsdom from 'jsdom'

const { JSDOM } = jsdom

const { window } = new JSDOM('')
const DOMPurify = createDOMPurify(window)

export const sanitizeData = (
    req: Request,
    _res: Response,
    next: NextFunction,
) => {
    Object.keys(req.body).forEach((key) => {
        req.body[key] = DOMPurify.sanitize(req.body[key])
    })

    next()
}
