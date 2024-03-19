import winston from 'winston'

const loggerOption = {
    transports: [
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
        }),
        new winston.transports.File({
            filename: 'logs/warn.log',
            level: 'warn',
        }),
    ],
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.metadata(),
        winston.format.prettyPrint(),
    ),
}

const logger: winston.Logger = winston.createLogger(loggerOption)

export default logger
