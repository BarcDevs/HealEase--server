import { build } from 'esbuild'

build({
    entryPoints: ['src/app.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: 'dist/server.js',
    external: [
        'aws-sdk',
        'mock-aws-s3',
        'nock',
        'jsdom',
        '@prisma/client',
        'prisma'
    ]
}).catch(() => process.exit(1))
