# Feedback Log

Corrections and confirmed preferences given to Claude during sessions in this repo. Newest entries at the bottom. Split into `feedbacks/<subject>.md` once this file gets large, and index the split files here.

---

## 2026-08-10

- **DB is RDS, not Neon.** Neon was fully replaced during the AWS migration — don't reference it as current infra.
- **CI/CD pushes images to ECR, not S3.** S3 was only ever the *planned* client hosting; it never shipped that way.
- **Client is deployed on its own EC2+Docker instance, not S3+CloudFront.** `docs/DEPLOYMENT.md` still describes the old S3+CloudFront plan for the client — it's stale. Actual: client EC2 is the public front door (`pulserehab.app`), proxies `/api/:path*` to the server EC2 over private VPC. Both client and server use the same ECR + SSM blue/green deploy pattern. Source of truth for current client infra: `pulse--client/CLAUDE.md` and `pulse--client/README.md`, not `pulse--server/docs/DEPLOYMENT.md`.
- **Domain DNS is Cloudflare, not Route53.** `pulserehab.app` is registered/managed in Cloudflare (proxied, SSL mode Flexible) pointing at EC2 public IP — no R53 involved.
