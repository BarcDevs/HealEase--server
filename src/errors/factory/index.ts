import { AuthFactory } from './AuthFactory'
import { ValidationFactory } from './ValidationFactory'
import { GenericFactory } from './GenericFactory'

export class ErrorFactory {
    auth = AuthFactory

    validation = ValidationFactory

    generic = GenericFactory

    static GenericError(message: string) {
        return new Error(message)
    }
}

export const errorFactory = new ErrorFactory()
