import { CustomError } from './CustomError'
import { HttpStatusCodes } from '../constants/httpStatusCodes'

class AuthError extends CustomError {
    statusCode = HttpStatusCodes.NOT_FOUND

    statusType = 'Authentication Error'

    constructor(
        message: string,
        private property?: string,
        statusType?: string,
        statusCode?: number,
    ) {
        super(message)
        this.statusType = statusType ?? this.statusType
        this.statusCode = statusCode ?? this.statusCode

        Object.setPrototypeOf(this, AuthError.prototype)
    }

    serializeErrors() {
        return [
            {
                statusType: this.statusType,
                statusCode: this.statusCode,
                error: this.message,
                property: this.property,
            },
        ]
    }
}

export { AuthError }
