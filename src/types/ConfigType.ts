type EnvConfig = string

type ServerConfig = {
    url: string
    port: number
    host: string
    protocol: string
}

type AppConfig = {
    start: string
}

type EmailConfig = {
    service: string
    port: number
    secure: boolean
    emailUser: string
    emailPass: string
}

type AuthConfig = {
    jwtSecret: string
    expiresIn: string
    otp_expiration: number
}

export { EnvConfig, EmailConfig, ServerConfig, AppConfig, AuthConfig }
