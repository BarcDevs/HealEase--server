export default {
  env: 'production',
  server: {
    port: 8080,
    protocol: 'https',
    origin: process.env.ORIGIN || 'https://localhost:5173',
  },
  auth: {
    expiresIn: '1d',
  },
  email: {
    port: 578,
    secure: true,
  }
}
