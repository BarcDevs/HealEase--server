# Feedback Log

Corrections and confirmed preferences given to Claude during sessions in this repo. Newest entries at the bottom. Split into `feedbacks/<subject>.md` once this file gets large, and index the split files here.

---

## 2026-08-10

- **DB is RDS, not Neon.** Neon was fully replaced during the AWS migration — don't reference it as current infra.
- **CI/CD pushes images to ECR, not S3.** S3 was only ever the *planned* client hosting; it never shipped that way.
- **Client is deployed on its own EC2+Docker instance, not S3+CloudFront.** `docs/DEPLOYMENT.md` still describes the old S3+CloudFront plan for the client — it's stale. Actual: client EC2 is the public front door (`pulserehab.app`), proxies `/api/:path*` to the server EC2 over private VPC. Both client and server use the same ECR + SSM blue/green deploy pattern. Source of truth for current client infra: `pulse--client/CLAUDE.md` and `pulse--client/README.md`, not `pulse--server/docs/DEPLOYMENT.md`.
- **Domain DNS is Cloudflare, not Route53.** `pulserehab.app` is registered/managed in Cloudflare (proxied, SSL mode Flexible) pointing at EC2 public IP — no R53 involved.
- **Use existing time-constants (`*InMs`) instead of hardcoding ms math.** Wrote `1000 * 60 * 60 * 24` in `contextBuilder.ts` for day-gap calc — should've checked `src/constants/time.ts` first, which already exports `dayInMs`. Fixed to import and use it. Always check `constants/time.ts` before hardcoding ms conversions.

## 2026-09-02

- **Told the user AWS cost would be "nearly free" without checking combined infra cost across both EC2 instances (client + server) running concurrently — real August bill was $63.78.** Only reasoned about marginal CI/CD pipeline run cost (SSM calls, image pushes — genuinely near-free), never surfaced that two always-on EC2 instances plus RDS plus a NAT Gateway is a real recurring baseline cost regardless of CI/CD, or that AWS's 750hr/month free-tier EC2 pool is *shared across all instances on the account combined*, not per-instance — running two instances 24/7 blows past it (confirmed: ~1,262 combined hours vs. 750hr cap that month). Should have proactively flagged expected monthly baseline cost (EC2+RDS+NAT, roughly $50-65/mo for this stack) at the point the second EC2 instance (client) went live, not waited for a surprise invoice. **How to apply:** whenever a session adds or confirms a second concurrently-running billable resource (a new EC2 instance, RDS instance, etc.), proactively note the combined free-tier-hour math and expected recurring cost — don't only cost out the specific change being made in isolation.

## 2026-09-07

- **Marked a bug "Fixed"/resolved in TODO.md and decisions.md after only implementing infra/code changes — before deploying or actually testing the fix.** Google OAuth secrets fix (Secrets Manager + IAM + config changes) was logged as done same turn it was written, with no deploy and no login flow ever run. User caught it. **How to apply:** never mark a bug resolved/strike it through until it's been deployed AND actually verified working (run the flow, check the log/output) — root-causing + patching is "fix implemented, pending verification," not "fixed." Use that exact phrasing in TODO/decisions until verification actually happens.
