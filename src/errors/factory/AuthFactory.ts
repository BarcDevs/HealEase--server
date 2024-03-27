import { AuthError } from '../AuthError'
import { HttpStatusCodes } from '../../constants/httpStatusCodes'

export class AuthFactory {
    static generic = (message: string) => new AuthError(message)

    static credentials = (message?: string) =>
        new AuthError(
            `Invalid credentials! ${message ?? 'please try again!'}`,
            undefined,
            'Invalid Credentials',
            HttpStatusCodes.UNAUTHORIZED
        )

    static unauthorized = (message?: string) =>
        new AuthError(
            `Unauthorized! ${message ?? 'please login first!'}`,
            undefined,
            'Unauthorized',
            HttpStatusCodes.UNAUTHORIZED
        )
}
