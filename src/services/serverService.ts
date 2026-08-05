import * as serverModel from '../models/serverModel'

export const isDatabaseReady = async (): Promise<boolean> => {
    try {
        await serverModel.pingDatabase()

        return true
    } catch {
        return false
    }
}
