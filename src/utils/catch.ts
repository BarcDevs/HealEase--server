// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const catchModel = (fn: (...args: any) => any, msgPrefix = '') => {
    try {
        return fn()
    } catch (error) {
        const err = error as Error
        throw new Error(`${msgPrefix}${err.message}`)
    }
}
