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
        req.body = Object.entries(req.body).reduce(
            (acc, [key, value]) => {
                if (key !== 'csrfToken') {
                    acc[key] = value
                }
                return acc
            },
            {} as Record<string, unknown>
        )
    }
}

const sanitize = (data: unknown): unknown => {
    if (!data) return data
    if (typeof data === 'string') return DOMPurify.sanitize(data)

    if (Array.isArray(data)) return data.map(sanitize)

    if (typeof data === 'object') {
        return Object.entries(data as Record<string, unknown>).reduce(
            (acc, [key, value]) => {
                acc[key] = sanitize(value)
                return acc
            },
            {} as Record<string, unknown>
        )
    }
    return data
}

export const sanitizeData = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    req.body = sanitize(req.body)

    extractCsrfToken(req)

    if (isBodyEmpty(req)) {
        req.body = null
        return next()
    }

    return next()
}
