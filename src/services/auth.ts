import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import Csrf from 'csrf'
import * as authModel from '../modules/AuthModel'
import { AuthError } from '../errors/AuthError'
import { sendEmail } from '../utils/emailSender'
import { HttpStatusCodes } from '../constants/httpStatusCodes'
import { authConfig } from '../../config'
import { UserType } from '../types/UserType'

const getUser = async (by: 'email' | 'id', value: string) => {
    let user: UserType | null
    switch (by) {
        case 'email':
            user = await authModel.getUserByEmail(value)
            break
        case 'id':
            user = await authModel.getUserById(value)
            break
        default:
            user = null
            break
    }

    return user
}

const generateResetPasswordOTP = (): { OTP: number; OTPExpiration: Date } => {
    const OTP = Math.floor(100000 + Math.random() * 900000)
    const OTPExpiration = new Date(Date.now() + authConfig.otp_expiration) // 10 minutes

    return {
        OTP,
        OTPExpiration,
    }
}

const removeResetPasswordOTP = async (userId: string): Promise<void> => {
    await authModel.updateUser(userId, {
        resetPasswordOTP: null,
        resetPasswordExpiration: null,
        password_updated_at: new Date(Date.now()),
    })
}

const verifyResetPasswordOTP = (
    resetPasswordOTP: number,
    resetPasswordExpiration: Date,
    OTP: number,
): boolean => {
    const now = new Date()
    return now < resetPasswordExpiration && resetPasswordOTP === +OTP
}

const sendEmailWithOTP = async (email: string): Promise<boolean> => {
    const user: UserType | null = await authModel.getUserByEmail(email)

    if (!user) return false

    const { OTP, OTPExpiration } = generateResetPasswordOTP()

    await authModel.updateUser(user.id, {
        resetPasswordOTP: OTP,
        resetPasswordExpiration: OTPExpiration,
    })

    sendEmail(
        email,
        'Confirm Email',
        `here is your OTP for confirm email: ${OTP}`,
    )

    return true
}

const createToken = (user: UserType): string => {
    const payload = { id: user.id, email: user.email }
    const options = { expiresIn: authConfig.expiresIn }

    return jwt.sign(payload, authConfig.jwtSecret!, options)
}

const generateCSRFToken = () => {
    const csrfProtection = new Csrf()

    const csrfSecret = csrfProtection.secretSync()
    const csrfToken = csrfProtection.create(csrfSecret)

    return {
        csrfSecret,
        csrfToken,
    }
}

const hashPassword = (password: string): string => bcrypt.hashSync(password, 10)

const comparePassword = (password: string, hashedPassword: string): boolean =>
    bcrypt.compareSync(password, hashedPassword)

const login = async (email: string, password: string): Promise<string> => {
    const user: UserType | null = await getUser('email', email)

    if (!user || !comparePassword(password, user.password)) {
        throw new AuthError('User not found!')
    }

    return createToken(user)
}

const register = async (newUser: UserType): Promise<UserType> => {
    const userExists: UserType | null = await authModel.getUserByEmail(
        newUser.email,
    )

    if (userExists)
        throw new AuthError(
            'User already exists!',
            'email',
            'Conflict',
            HttpStatusCodes.CONFLICT,
        )

    const PasswordHash = hashPassword(newUser.password)

    const userAfterHashedPassword = { ...newUser, password: PasswordHash }

    return authModel.createUser(userAfterHashedPassword)
}

const resetPassword = async (
    userId: string,
    newPassword: string,
): Promise<UserType> =>
    authModel.updateUser(userId, { password: hashPassword(newPassword) })

export {
    getUser,
    register,
    login,
    createToken,
    sendEmailWithOTP,
    verifyResetPasswordOTP,
    resetPassword,
    removeResetPasswordOTP,
    hashPassword,
    comparePassword,
    generateCSRFToken,
}
