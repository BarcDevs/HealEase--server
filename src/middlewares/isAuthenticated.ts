import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { UserType } from '../types/data/UserType'
import { authConfig } from '../../config'
import { errorFactory } from '../errors/factory'

export const isAuthenticated = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { accessToken } = req.cookies

        const { id } = jwt.verify(
            accessToken,
            authConfig.jwtSecret!
        ) as Partial<UserType>

        req.locals = {
            ...req.locals,
            userId: id
        }

        next()
    } catch (error) {
        res.clearCookie('accessToken')

        throw errorFactory.auth.unauthorized()
    }
}
