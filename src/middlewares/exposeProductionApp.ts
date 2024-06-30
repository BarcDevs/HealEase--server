import path from 'path'
import express, { Express } from 'express'
import { env } from '../../config'

function exposeProductionApp(app: Express) {
    if (env !== 'production') return

    const buildDir = path.join(__dirname, '..', '..', 'client', 'dist')
    console.log('serving build resources at', buildDir)

    app.use('/', express.static(buildDir))
    app.use((req, res) => {
        res.sendFile(path.join(buildDir, 'index.html'))
    })
}

export default exposeProductionApp
