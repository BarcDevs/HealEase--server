export default {
    env: 'test',
    server: {
        port: 8000,
        protocol: 'http',
        host: 'localhost',
        origin: 'http://localhost:5173'
    },
    auth: {
        jwtSecret: 'test-only-jwt-secret-do-not-use-in-production'
    }
}
