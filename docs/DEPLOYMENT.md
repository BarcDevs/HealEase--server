# AWS Deployment

Server runs on **EC2 + RDS** in `eu-central-1` (Frankfurt), replacing Render. Client
(separate repo) is not yet deployed — planned as S3 + CloudFront.

## Live infrastructure

| Resource | Value |
|---|---|
| AWS account | `110015905368` (Bardevs) |
| EC2 instance | `i-0df518d8572bfcfd6` — `t3.small`, `35.157.40.177`, Amazon Linux 2023, encrypted 30GB gp3 root volume |
| RDS instance | `pulse-db` — `pulse-db.cpwwgeuy62ph.eu-central-1.rds.amazonaws.com:5432`, Postgres 17.10, `db.t3.micro`, encrypted, deletion-protected, not publicly accessible |
| Domain | `pulserehab.app` (Cloudflare DNS, proxied, SSL mode: Flexible) → EC2 public IP. Client will take over the root path once deployed; API already lives under `/api/v2` so no path-routing conflict yet. |
| EC2 security group | `sg-0c263224f1d77df26` — SSH (22) restricted to operator's IP only, HTTP/HTTPS (80/443) open |
| RDS security group | `sg-0d6e9cdd1a065d584` — Postgres (5432) restricted to the EC2 security group only, no public CIDR |
| IAM role (EC2) | `pulse-ec2-role` / instance profile `pulse-ec2-instance-profile` — scoped to `secretsmanager:GetSecretValue` on exactly the secrets below, nothing broader |
| CloudTrail | `pulse-trail`, multi-region, logging to `pulse-cloudtrail-logs-110015905368` (log file validation on) |

## Secrets (AWS Secrets Manager, eu-central-1)

| Secret name | Contents |
|---|---|
| `pulse/rds/master-credentials` | `{"username": "pulse_admin", "password": "..."}` |
| `pulse/app/jwt-secret` | Raw JWT signing secret |
| `pulse/app/ANTHROPIC_API_KEY` | Raw key |
| `pulse/app/GOOGLE_AI_API_KEY` | Raw key |
| `pulse/app/GOOGLE_FREE_AI_API_KEY` | Raw key |
| `pulse/app/OPENAI_API_KEY` | Raw key |

The EC2 instance role can read all of these directly — no keys live in `.env` files
or shell history on the box itself.

## DATABASE_URL format

RDS enforces SSL by default. The connection string must include:

```
postgresql://<user>:<pass>@<rds-endpoint>:5432/pulse?uselibpqcompat=true&sslmode=require
```

Omitting the query params fails with a misleading Prisma error
(`User was denied access on the database`) — the real cause is `pg` rejecting the
plaintext connection, not a permissions problem.

## Redeploy steps (manual, no CI/CD pipeline yet)

1. Merge the target branch into `main` (CI-gated: `aws-deploy` → `development` → `main`,
   each hop needs green checks before merging — see `GIT_RULES.md`).
2. SSH in: `ssh -i ~/.ssh/pulse-ec2-key.pem ec2-user@35.157.40.177`
3. Pull and rebuild:
   ```bash
   cd app && git pull origin main
   sudo docker build --target runner -t pulse-app .
   ```
4. If the schema changed, run migrations first from the `builder` stage (has full
   devDependencies — `prisma` CLI is a devDependency, not in the runner image):
   ```bash
   sudo docker build --target builder -t pulse-migrate .
   sudo docker run --rm -e DATABASE_URL="<url-with-sslmode>" pulse-migrate npm run release
   ```
5. Restart the container:
   ```bash
   sudo docker rm -f pulse-app
   sudo docker run -d --name pulse-app --restart=always -p 80:8080 \
     -e NODE_ENV=production \
     -e SERVER_API_VERSION=v2 \
     -e ORIGIN=https://pulserehab.app \
     -e DATABASE_URL="<url-with-sslmode>" \
     -e JWT_SECRET="<from-secrets-manager>" \
     -e ANTHROPIC_API_KEY="<from-secrets-manager>" \
     -e GOOGLE_AI_API_KEY="<from-secrets-manager>" \
     -e GOOGLE_FREE_AI_API_KEY="<from-secrets-manager>" \
     -e OPENAI_API_KEY="<from-secrets-manager>" \
     pulse-app
   ```
   All env values should be pulled live from Secrets Manager (the instance role can do
   this — see the pattern used in step-by-step deploy history), not hardcoded.
6. Verify: `curl https://pulserehab.app/api/status` and a real DB-backed route (health
   checks alone don't catch DB/SSL misconfiguration — confirmed the hard way).

## Known build-time gotchas

- **Prisma generator module format** — `prisma-client` (the generator in
  `prisma/schema.prisma`) defaults to ESM/TS-native output that `require()`s sibling
  `.ts` files directly, assuming a bundler or TS-native runtime. Fixed by pinning
  `moduleFormat = "cjs"` on the generator.
- **Explicit `.ts` extensions in generated imports** — even with `moduleFormat = "cjs"`,
  the generated client's `require()` calls use literal `.ts` extensions
  (`require("./internal/class.ts")`), which plain `tsc` (Node10 resolution) doesn't
  rewrite. Fixed with `rewriteRelativeImportExtensions: true` in `tsconfig.json`
  (TS 5.7+), and `prisma/generated` added to tsconfig's `include` so tsc actually
  compiles it into `dist/`.
- **Jest can't resolve those same extensions** — ts-jest applies the same
  `rewriteRelativeImportExtensions` setting during its own transform, so by the time
  Jest's resolver sees the import it's already rewritten to `.js` — but the raw
  generated source tree (used directly by ts-jest, not the compiled `dist/`) has no
  `.js` files, only `.ts`. Fixed with a `moduleNameMapper` in both `jest.config.ts` and
  `jest.integration.config.ts` stripping `.ts`/`.js` from relative import specifiers
  before Jest resolves them.
- **Webpack is gone** — the old `start:prod`/`prod` scripts and full webpack toolchain
  were Render-only leftovers; `tsc` is the only bundler now (see `Dockerfile`'s
  `builder` stage). `prisma` (the CLI) lives in `devDependencies`, not `dependencies` —
  the runner image's `npm ci --omit=dev` drops it, and migrations run from the
  `builder` target instead (full devDependencies), as a one-off step before rolling
  out the runner image.

## Not yet done

- Client deploy (S3 + CloudFront) — root path on `pulserehab.app` currently just hits
  this server's Express app; will need to be repointed once the client ships.
- CI/CD automation — redeploy is currently a manual SSH + `git pull` + `docker build`
  sequence (see above). No auto-deploy-on-merge yet.
- `staging.pulserehab.app` — not yet configured.
- AWS Activate / startup credits — domain and AWS account are both recent, worth
  applying once there's a concrete product description to submit.
