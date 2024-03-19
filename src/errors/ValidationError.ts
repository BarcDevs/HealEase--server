import { CustomError } from './CustomError'
import { HttpStatusCodes } from '../constants/httpStatusCodes'

class ValidationError extends CustomError {
    statusCode = HttpStatusCodes.FORBIDDEN

    statusType = 'Validation Error'

    constructor(
        message: string,
        private property?: string,
    ) {
        super(message)

        Object.setPrototypeOf(this, ValidationError.prototype)
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

export { ValidationError }
