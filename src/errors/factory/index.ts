import { AuthFactory } from './AuthFactory'
import { ValidationFactory } from './ValidationFactory'

class ErrorFactory {
    auth = AuthFactory

    validation = ValidationFactory

    static genericError(message: string) {
        return new Error(message)
    }
}

export const errorFactory = new ErrorFactory()
