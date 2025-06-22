export default {
    env: 'NODE_ENV',
    app: {
        start: `Server is running on {0}`
    },
    server: {
        port: 3000,
        host: `localhost`,
        protocol: `http`,
        url: '{protocol}://{host}:{port}',
        origin: 'http://localhost:5173',
        apiVersion: 'v1'
    },
    auth: {
        jwtSecret: 'JWT_SECRET',
        expiresIn: 1000 * 60 * 60 * 24,
        otp_expiration: 1000 * 60 * 60 * 24
    },
    email: {
        host: 'sandbox.smtp.mailtrap.io',
        service: 'Mailtrap',
        port: 465,
        secure: false,
        emailUser: 'EMAIL_USER',
        emailPass: 'EMAIL_PASS'
    }
}

