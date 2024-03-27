import { ValidationResult } from 'joi'
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

    static catchValidationErrors = <T>(
        validatedRes: ValidationResult<T>,
    ): T => {
        if (!validatedRes.error) return validatedRes.value as T
        const errorMessage = validatedRes.error!.message
        const errorProperty = validatedRes.error!.details[0].path[0]

        throw new ValidationError(errorMessage, errorProperty as string)
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
