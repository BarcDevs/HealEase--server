export default {
  env: 'production',
  server: {
    port: 8080,
    protocol: 'https',
    origin: process.env.ORIGIN || 'https://localhost:5173',
    host: '0.0.0.0'
  },
  auth: {
    expiresIn: '7d',
  },
  email: {
    port: 578,
    secure: true,
  }
}
