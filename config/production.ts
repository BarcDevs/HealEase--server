export default {
    env: 'production',
    server: {
        port: process.env.PORT || 8080,
        protocol: 'https',
        origin:
            process.env.ORIGIN
            || 'https://pulse-client.vercel.app',
        host: '0.0.0.0'
    },
    auth: {
        expiresIn: '7d'
    },
    email: {
        port: 587,
        secure: true
    },
    ai: {
        provider: 'anthropic',
        fallbackOrder: 'anthropic,google-pro,openai'
    }
}