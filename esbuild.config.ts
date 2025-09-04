import { build } from 'esbuild'

async function main () {
    try {
        await build({
            entryPoints: ['src/app.ts'],
            bundle: true,
            platform: 'node',
            outfile: 'dist/server.js',
            sourcemap: true,
            minify: false,
            external: [
                'aws-sdk',
                'mock-aws-s3',
                'nock',
                '*.html',
                './xhr-sync-worker.js'
            ]
        })
        console.log('Build completed successfully!')
    } catch ( err ) {
        console.error('Build failed:', err)
        process.exit(1)
    }
}

main()
