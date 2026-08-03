import express, { type Express } from 'express'
import path from 'path'

import { env } from '../../config'
import logger from '../utils/logger'

const exposeProductionApp = (app: Express) => {
    if (env !== 'production') return

    const buildDir = path.join(
        __dirname,
        '..',
        '..',
        'client',
        'dist'
    )
    logger.info('serving build resources at', buildDir)

    app.use('/', express.static(buildDir))
}

export default exposeProductionApp
