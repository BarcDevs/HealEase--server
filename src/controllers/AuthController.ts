import { Request, Response } from 'express'
import { ValidationResult } from 'joi'

import { AuthError } from '../errors/AuthError'
import * as authServices from '../services/auth'
import { loginSchema } from '../schemas/auth/loginSchema'
import { signupSchema } from '../schemas/auth/signupSchema'
import { forgetPasswordSchema } from '../schemas/auth/forgetPasswordSchema'
import { confirmEmailSchema } from '../schemas/auth/confirmEmailSchema'
import { resetPasswordSchema } from '../schemas/auth/resetPasswordSchema'
import { HttpStatusCodes } from '../constants/httpStatusCodes'
import { ValidationError } from '../errors/ValidationError'
import { ResponseType } from '../types/ResponseType'
import { UserType } from '../types/UserType'

const login = async (req: Request, res: Response) => {
    const { email, password } = req.body

    const validated: ValidationResult = loginSchema.validate(req.body)

    if (validated.error) {
        const errorMessage = validated.error.message
        const errorProperty = validated.error.details[0].path[0]

        throw new ValidationError(errorMessage, errorProperty as string)
    }

    const token = await authServices.login(email, password)
    const { csrfSecret, csrfToken: _csrf } = authServices.generateCSRFToken()

    const cookiesOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
        sameSite: 'strict' as const,
        secure: false,
        maxAge: 1000 * 60 * 60 * 24,
    }

    res.cookie('accessToken', token, cookiesOptions)
    res.cookie('_csrf', csrfSecret, cookiesOptions)

    const response: ResponseType<{ token: string; _csrf: string }> = {
        message: 'user logged in!',
        data: { token, _csrf },
    }
    res.status(HttpStatusCodes.OK).json(response)
}

const signup = async (req: Request, res: Response) => {
    const validated: ValidationResult = signupSchema.validate(req.body)

    if (validated.error) {
        const errorMessage = validated.error.message
        const errorProperty = validated.error.details[0].path[0]

        throw new ValidationError(errorMessage, errorProperty as string)
    }

    const newUserCreated: UserType = await authServices.register(req.body)

    const response: ResponseType<{ user: UserType }> = {
        message: 'User created!',
        data: {
            user: newUserCreated,
        },
    }
    res.status(HttpStatusCodes.CREATED).json(response)
}

const logout = async (_req: Request, res: Response) => {
    // remove cookie
    res.clearCookie('accessToken')

    res.status(HttpStatusCodes.OK).json({
        message: 'user logged out!',
    })
}

const me = async (req: Request, res: Response) => {
    const { userId } = req.locals

    const user: UserType | null = await authServices.getUser(
        'id',
        userId as string,
    )

    if (!user)
        throw new AuthError(
            'Unauthorized! please login first!',
            undefined,
            'Unauthorized',
            HttpStatusCodes.UNAUTHORIZED,
        )

    const response: ResponseType<{ user: UserType }> = {
        message: 'User info!',
        data: {
            user,
        },
    }
    res.status(HttpStatusCodes.OK).json(response)
}

const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.params

    const validated: ValidationResult = forgetPasswordSchema.validate({
        email,
    })

    if (validated.error) {
        const errorMessage = validated.error.message
        const errorProperty = validated.error.details[0].path[0]

        throw new ValidationError(errorMessage, errorProperty as string)
    }

    // send email to user with OTP for confirm email
    await authServices.sendEmailWithOTP(email)

    res.status(HttpStatusCodes.OK).json({
        message:
            'We have sent you an email with an OTP to confirm your email! Please check your email.',
    })
}

const confirmEmail = async (req: Request, res: Response) => {
    const { OTP, email } = req.body

    const validated: ValidationResult = confirmEmailSchema.validate(req.body)

    if (validated.error) {
        const errorMessage = validated.error.message
        const errorProperty = validated.error.details[0].path[0]

        throw new ValidationError(errorMessage, errorProperty as string)
    }

    const user: UserType | null = await authServices.getUser('email', email)

    const OTPValid =
        user &&
        authServices.verifyResetPasswordOTP(
            user.resetPasswordOTP!,
            user.resetPasswordExpiration!,
            OTP,
        )

    if (!OTPValid) throw new ValidationError('OTP is not valid!', 'OTP')

    const response: ResponseType<{ user: UserType }> = {
        message: 'Your email is confirmed!',
        data: {
            user,
        },
    }
    res.status(HttpStatusCodes.CREATED).json(response)
}

const resetPassword = async (req: Request, res: Response) => {
    const { email, newPassword, userOTP } = req.body

    const validated: ValidationResult = resetPasswordSchema.validate(req.body)

    if (validated.error) {
        const errorMessage = validated.error.message
        const errorProperty = validated.error.details[0].path[0]

        throw new ValidationError(errorMessage, errorProperty as string)
    }

    const user: UserType | null = await authServices.getUser('email', email)

    if (
        !user ||
        !authServices.verifyResetPasswordOTP(
            user.resetPasswordOTP!,
            user.resetPasswordExpiration!,
            userOTP,
        )
    ) {
        throw new AuthError(
            'There is an error occurred! Please try again.',
            undefined,
            'Reset Password',
        )
    }

    await authServices.resetPassword(user.id, newPassword)

    await authServices.removeResetPasswordOTP(user.id)

    const response: ResponseType<{ user: UserType }> = {
        message: 'Password changed successfully!',
        data: {
            user,
        },
    }
    res.status(HttpStatusCodes.OK).json(response)
}

export {
    login,
    signup,
    logout,
    me,
    forgotPassword,
    resetPassword,
    confirmEmail,
}
