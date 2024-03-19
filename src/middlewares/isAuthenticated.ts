import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { UserType } from '../types/UserType'
import { AuthError } from '../errors/AuthError'
import { HttpStatusCodes } from '../constants/httpStatusCodes'
import { authConfig } from '../../config'

export const isAuthenticated = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { accessToken } = req.cookies

        const { id } = jwt.verify(
            accessToken,
            authConfig.jwtSecret!,
        ) as Partial<UserType>

        req.locals = { userId: id }

        next()
    } catch (error) {
        res.clearCookie('accessToken')

        throw new AuthError(
            'User not authenticated!',
            undefined,
            'Unauthorized',
            HttpStatusCodes.UNAUTHORIZED,
        )
    }
}
