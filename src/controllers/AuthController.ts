import { Request, Response } from 'express'
import * as authServices from '../services/authService'
import {
    generateRandomUsername,
    getCookiesOptions,
    sanitizeUserData
} from '../services/authService'
import { loginSchema } from '../schemas/auth/loginSchema'
import { signupSchema } from '../schemas/auth/signupSchema'
import { forgetPasswordSchema } from '../schemas/auth/forgetPasswordSchema'
import { confirmEmailSchema } from '../schemas/auth/confirmEmailSchema'
import { resetPasswordSchema } from '../schemas/auth/resetPasswordSchema'
import { HttpStatusCodes } from '../constants/httpStatusCodes'
import { ServerUserType, UserType } from '../types/data/UserType'
import { successResponse } from '../responses/success'
import { ValidationError } from '../errors/ValidationError'
import { errorFactory } from '../errors/factory'

const login = async (req: Request, res: Response) => {
    const { email, password, remember } = ValidationError.catchValidationErrors(
        loginSchema.validate(req.body)
    )

    const token = await authServices.login(email, password)
    const { csrfSecret, csrfToken: _csrf } = authServices.generateCSRFToken()

    const cookiesOptions = getCookiesOptions(remember)

    res.cookie('accessToken', token, cookiesOptions)
    res.cookie('_csrf', csrfSecret, {
        ...cookiesOptions,
        maxAge: 60 * 60 * 1000
    })

    successResponse<{ token: string; _csrf: string }>(
        res,
        { token, _csrf },
        'user logged in!'
    )
}

const signup = async (req: Request, res: Response) => {
    const userData = ValidationError.catchValidationErrors(
        signupSchema.validate(req.body)
    )

    const newUserCreated: ServerUserType = await authServices.register({
        ...userData,
        username: userData.username || generateRandomUsername()
    })

    successResponse<{ user: UserType }>(
        res,
        { user: sanitizeUserData(newUserCreated) },
        'user created!',
        HttpStatusCodes.CREATED
    )
}

const getCsrfToken = async (req: Request, res: Response) => {
    const { csrfSecret, csrfToken: _csrf } = authServices.generateCSRFToken()
    const cookiesOptions = getCookiesOptions(false)

    res.cookie('_csrf', csrfSecret, cookiesOptions)

    successResponse<{ _csrf: string }>(res, { _csrf }, 'CSRF token generated!')
}

const logout = async (_req: Request, res: Response) => {
    // remove cookie
    res.clearCookie('accessToken')

    successResponse(res, {}, 'user logged out!')
}

const me = async (req: Request, res: Response) => {
    const { userId } = req || {}

    const user: ServerUserType | null = userId
        ? await authServices.getUser('id', userId)
        : null

    if (!user) throw errorFactory.auth.unauthorized()

    successResponse<{ user: UserType }>(
        res,
        { user: sanitizeUserData(user) },
        'user info!'
    )
}

const forgotPassword = async (req: Request, res: Response) => {
    const { email } = ValidationError.catchValidationErrors(
        forgetPasswordSchema.validate(req.body)
    )

    // send email to user with OTP for confirm email
    await authServices.sendEmailWithOTP(email)

    successResponse(
        res,
        {},
        'We have sent you an email with an OTP to confirm your email! Please check your email.'
    )
}

const confirmEmail = async (req: Request, res: Response) => {
    const { OTP, email } = ValidationError.catchValidationErrors(
        confirmEmailSchema.validate(req.body)
    )

    const user: ServerUserType | null = await authServices.getUser(
        'email',
        email
    )

    const OTPValid =
        user &&
        authServices.verifyResetPasswordOTP(
            user.resetPasswordOTP!,
            user.resetPasswordExpiration!,
            OTP
        )

    if (!OTPValid) throw errorFactory.validation.otpError()

    successResponse<{
        user: UserType
    }>(
        res,
        { user: sanitizeUserData(user) },
        'Your email is confirmed!',
        HttpStatusCodes.CREATED
    )
}

const resetPassword = async (req: Request, res: Response) => {
    const { email, newPassword, userOTP } =
        ValidationError.catchValidationErrors(
            resetPasswordSchema.validate(req.body)
        )

    const user: ServerUserType | null = await authServices.getUser(
        'email',
        email
    )

    if (
        !user ||
        !authServices.verifyResetPasswordOTP(
            user.resetPasswordOTP!,
            user.resetPasswordExpiration!,
            userOTP
        )
    )
        throw errorFactory.auth.resetPassword()

    await authServices.resetPassword(user.id, newPassword)
    await authServices.removeResetPasswordOTP(user.id)

    successResponse<{ user: UserType }>(
        res,
        { user: sanitizeUserData(user) },
        'Password has changed successfully!'
    )
}

export {
    login,
    signup,
    logout,
    me,
    forgotPassword,
    resetPassword,
    confirmEmail,
    getCsrfToken
}
