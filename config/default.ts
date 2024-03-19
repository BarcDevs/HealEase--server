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
        origin: 'http://localhost:5173'
    },
    auth: {
        jwtSecret: 'JWT_SECRET',
        expiresIn: '1h',
        otp_expiration: 1000 * 60 * 10
    },
    email: {
        service: 'gmail.com',
        port: 465,
        secure: false,
        emailUser: 'EMAIL_USER',
        emailPass: 'EMAIL_PASS'
    }
}

