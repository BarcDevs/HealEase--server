export interface ICustomError {
    statusCode: number
    statusType: string

    serializeErrors(): {
        statusType: string
        statusCode?: number
        error: string
        field?: string
    }[]
}
