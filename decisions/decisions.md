# Decisions Log

Architecture/technical decisions made during sessions in this repo, with reasoning. Newest entries at the bottom. Split into `decisions/<subject>.md` once this file gets large, and index the split files here.

---

## 2026-08-10 — Check-in gap detection for intervention feedback

**Problem:** `contextBuilder.ts` builds AI intervention context from the last 7 check-in records (`checkInModel.getCheckIns(profileId, 7)`), ordered by `checkInDate desc`. If a user has a reporting gap (e.g. 3 weeks of silence), those 7 records can span a much longer real time window than 7 days. `determineTrendDirection` computed mood/pain deltas across that window with no gap awareness, so the AI could describe a "trend" that's actually two disconnected time periods — factually derived from real data, but temporally misleading.

**Decision:** Don't change the fetch (still `take: 7`, no date-range query, no extra DB round-trip). Instead, derive the gap from `checkInDate` values already in hand:
- Added `FEEDBACK_DETECTION.TREND.GAP_DAYS_THRESHOLD` (`src/constants/feedback/detection.ts`).
- Added `gapDays` to `InterventionContext.trend` (`src/types/feedback.ts`), computed as the largest gap between consecutive check-ins in the window (`contextBuilder.ts: calculateMaxGapDays`).
- If `gapDays >= GAP_DAYS_THRESHOLD`, `determineTrendDirection` forces `'stable'` instead of computing a delta.
- `aiRenderer.ts` prompt includes an explicit note when the gap exceeds threshold, instructing the AI not to imply a continuous trend.

**Why this approach over alternatives:** A date-windowed query (e.g. `WHERE checkInDate >= now() - 7d`) would silently return fewer/zero records on a gap instead of surfacing it, and adds a query variant to reason about. Computing the gap from already-fetched data costs nothing extra and lets both the deterministic trend math and the AI prompt react to it explicitly.

**How to apply:** Any other consumer of `getCheckIns` history for trend/streak logic (e.g. `progressInsightsService.ts`, `recommendationsService.ts`) should be checked for the same blind spot if it computes deltas across a record window without checking `checkInDate` continuity.

Implementation uses the existing `dayInMs` from `src/constants/time.ts` for the ms→days conversion (caught in review — first pass hardcoded `1000 * 60 * 60 * 24` instead of checking for an existing time-constants file).

**Follow-up (2026-08-12):** `GAP_DAYS_THRESHOLD` started at 10, dropped to **7** — too large relative to the 7-check-in fetch window; symmetric with it is simpler to reason about ("gap exceeding one check-in cycle voids the trend").

**TODO (future):** expose `trend`/`gapDays` to the client response — currently computed but discarded after prompt-building, only the AI's free-text output reaches the user. Positive ('up') trends are already fed into the AI prompt today, just not surfaced as structured data. **TODO (future):** split intervention feedback into two distinct messages (trend-change feedback + supportive feedback) instead of one blended AI response.

---

## 2026-08-11 — RAG: not needed app-wide, one legit fit identified for later

**Problem:** User asked whether the planned AI chat agent, check-in AI feedback, or various feature ideas (monthly comparison, chat memory, community post search) should use RAG. Investigated each: check-in history/goals/user profile are small structured per-user data (few rows) — direct DB query + prompt context is correct, RAG adds infra (vector store, embeddings, chunking) for a retrieval problem that doesn't exist at this scale.

**Found while investigating `/forum/recommendations`:** `computeSemanticSimilarity` in `src/lib/recommendations/scoring.ts` is misnamed — it's Jaccard token overlap (bag-of-words) on `keyIssueTags` vs. post title/body tokens, not real semantic/embedding similarity. This scores posts against a user's check-in-derived issue tags and genuinely fails on paraphrases (e.g. "can't sleep" vs. "insomnia" tag) since it requires literal token overlap.

**Decision:** Don't build a new feature to "use RAG." Instead, when picked up later, swap the Jaccard scoring in `computeSemanticSimilarity` (`src/lib/recommendations/scoring.ts:50-61`) for real embedding cosine similarity. This is a genuine RAG fit because the corpus (all forum posts) is large/growing and semantic retrieval solves a real, demonstrable failure mode already present in shipped code — not a manufactured use case.

**Why this approach over alternatives:** Considered community "similar posts" as a standalone feature, monthly check-in comparison, and persistent chat memory — all rejected as forced RAG (small/structured data, direct query suffices). This one is the only case where the existing code already claims to do semantic matching and doesn't.

**How to apply:** Scope when picked up — embed post title+body once per post (on create, or batch/cron for backfill), embed `keyIssueTags` per recommendation request, cosine similarity replacing Jaccard in `scorePost`. No chunking needed at current post volume. Check post volume and whether pgvector is available on the RDS instance (see `docs/DEPLOYMENT.md`) before choosing pgvector column vs. in-memory cached embeddings.

---

## 2026-08-12 — No manual AI provider switch needed before Anthropic price change

**Problem:** Anthropic token pricing increases after 2026-08-31. Considered manually switching the primary provider to Google before that date to avoid the higher rate.

**Decision:** Not needed. The app runs on a pre-purchased, fixed Anthropic token allotment with no auto-reload — those tokens are a sunk cost already paid at the old rate, not billed per-call going forward, and aren't used for anything else. The existing per-call fallback order (`fallbackOrder: 'anthropic,google-pro,openai'`, `config/production.ts`) already switches to Google automatically once the Anthropic allotment is exhausted or a call fails — no date-based manual switch adds anything.

**Why this approach over alternatives:** A scheduled manual switch on 31.8 was the original plan, but it only makes sense if the tokens have an expiry date or ongoing per-call billing risk (auto-reload). Neither applies here, so the existing reactive fallback is strictly sufficient — a proactive scheduled switch would just stop using already-paid-for tokens early.

**How to apply:** No action needed. Revisit only if the Anthropic allotment gets auto-reload enabled (then per-call cost becomes ongoing and a proactive switch may be worth it) or if the tokens turn out to have an expiry.

---

## 2026-08-12 — Post title/body length cap; pgvector confirmed viable; embedding model/vector DB picked for RAG plan

**Problem:** Three loose ends surfaced while prepping the RAG-for-recommendations plan (see 2026-08-11 entry above) for an architecture interview: (1) `newPostSchema`/`updatePostSchema` had no `.max()` on `title`/`body` — an unbounded string is both an abuse vector (huge paste) and, once embedding is added, a real risk of exceeding the embedding model's input token limit; (2) hadn't confirmed pgvector actually works on the current RDS instance (Postgres 17.10, `db.t3.micro`) before committing to the plan; (3) hadn't picked a concrete embedding model or a future vector-DB-at-scale option, which reads badly in an interview as "haven't decided."

**Decision:**
1. Added `POST_LIMITS` (`src/constants/forum/postLimits.ts`): `MAX_TITLE_LENGTH: 200`, `MAX_BODY_LENGTH: 10000` — applied via `.max()` in both `newPostSchema` and `updatePostSchema`. Chosen to sit far above any real forum post but comfortably under the ~8191-token input limit of the embedding model below (10000 chars ≈ 2500 tokens).
2. Confirmed pgvector is supported on RDS PostgreSQL 17.10 out of the box (AWS extended support down to 12.19+/13.15+/14.12+/15.7+/16.3+ as of the pgvector 0.7.0 update, May 2024) — no `shared_preload_libraries` or parameter-group change needed, just `CREATE EXTENSION IF NOT EXISTS vector;`. No extra AWS charge beyond normal RDS compute/storage; `db.t3.micro` is adequate at current post volume but a known constraint (burstable CPU, 1GB RAM) if the corpus grows to hundreds of thousands of vectors.
3. Picked `text-embedding-3-small` (OpenAI) as the embedding model — `OPENAI_API_KEY` already provisioned in Secrets Manager, cheap (~$0.02/M tokens), 1536 dimensions, sufficient quality for the current corpus size; `text-embedding-3-large` would be over-spec for the scale.
4. Picked Qdrant as the future dedicated vector DB if/when scale outgrows pgvector on `db.t3.micro` — open-source (self-host or managed), strong ANN-benchmark results, and supports combined filter+vector queries natively, which matters here because `scorePost` (`src/lib/recommendations/scoring.ts`) is already multi-signal (semantic + condition + stage + engagement + recency), not pure semantic search.

**Why this approach over alternatives:** `text-embedding-3-large` and Pinecone were the main alternatives considered — both rejected as over-spec/over-cost for current post volume, not because they're wrong in principle. Qdrant over Pinecone/Weaviate specifically because native filter+vector queries avoid adding a second scoring pass in application code.

**How to apply:** Length caps are live now (independent of RAG timing). The model/vector-DB choices are the plan to execute when the RAG work is actually picked up — no code for embeddings exists yet, only the scoring bug and this plan (see 2026-08-11 entry).

---

## 2026-08-13 — Single EC2 instance has no automated recovery (flagged as CRITICAL TODO)

**Problem:** Surfaced during architecture-interview prep, not from a production incident. Production deploy targets one fixed EC2 instance (`i-0df518d8572bfcfd6`), addressed by instance ID via SSM Run Command in `ec2-redeploy.sh`. The blue/green swap logic protects against a *bad deploy*, but there's no protection if the EC2 instance itself dies (hardware fault, host maintenance, etc.) — no Auto Scaling Group, no automated replacement. Recovery today means someone notices and fixes it by hand.

**Decision:** Move to an Auto Scaling Group with `min=1/max=1/desired=1`. This is not deferred for cost reasons — an ASG at desired=1 costs exactly the same as the standalone EC2 instance today, AWS doesn't charge for the ASG control plane itself. It's deferred because the current deploy pipeline assumes a static instance ID and a static IP, both of which break under ASG-managed replacement.

**Why this approach over alternatives:** A full multi-instance + Application Load Balancer setup was considered and rejected as premature — it solves a scaling problem we don't have yet, on top of the recovery problem we do have. `min=1/max=1` gets automated recovery (the actual gap) without taking on load-balancing complexity that isn't needed at current traffic.

**How to apply:** When picked up — (1) update `ec2-redeploy.sh`/the GitHub Actions workflow to target the ASG rather than a fixed instance ID for SSM Run Command, (2) handle the IP change on instance replacement: either re-associate a fixed Elastic IP to the new instance on launch, or move to a health-check-based DNS update in Cloudflare. Tracked as CRITICAL in `TODO.md`.

**2026-09-02 follow-up — capacity, EC2 rightsizing, and IP-stability approach:**

**Problem:** August AWS invoice came in at $63.78 (unexpected to the user). Root cause traced via Cost Explorer, not guessed: two EC2 instances ran concurrently all month — `pulse-client-app` (t3.micro) and `pulse-server` (t3.small, `i-0df518d8572bfcfd6`) — for a combined ~1,262 running-hours against the account's shared 750hr/month free-tier pool, so ~512 hours billed at full rate ($23.02 of the $28.10 EC2 charge, confirmed by matching per-instance-type cost breakdown: $7.28 micro + $15.73 small). The account's `get-free-tier-usage` API showed no free-tier credit actually applied to EC2 or RDS at all this cycle (only AWS Glue), separate from the general "T3.small is Free-Plan-eligible" marketing claim on AWS's docs, which describes plan eligibility, not a guarantee of zero cost past the shared hour quota. Remaining EC2 cost is EBS volume storage, not compute hours. RDS ($19.94) and VPC/NAT Gateway ($7.74, never free-tier eligible) are separately billed baseline costs, unrelated to CI/CD pipeline runs (those cost fractions of a cent — SSM calls + image pushes).

**Decision 1 — correct the `min=1/max=1` ASG sizing from the 2026-08-13 entry to `min=1/desired=1/max=2`.** `max=2` only provides headroom for a brief overlap during an unhealthy-instance replacement event — steady-state cost stays identical to today's single instance, it does not double the baseline bill. (Original entry is being kept as-is above for history; this note is the correction of record.)

**Decision 2 — downsized `pulse-server` from t3.small to t3.micro** (stop → modify-instance-attribute → start), since the instance currently carries no real traffic besides UptimeRobot's health check. Saves roughly half the instance's compute cost (~$15.73 → ~$7.28/mo at similar hours) and reduces the account's combined free-tier-hour pressure. Verified live afterward: `curl https://pulserehab.app/api/status` returned successfully post-restart. Tradeoff: t3.micro halves available RAM (2GB → 1GB) vs t3.small — acceptable pre-/early-launch, but Prisma connection pool memory should be watched via CloudWatch once real traffic starts, and resized back up if sustained memory pressure appears.

**Decision 3 — confirmed the resize surfaced the ASG IP-change risk is real, and settled the fix: Elastic IP over Route53, deferred until ASG exists.** The manual stop/start changed the instance's public IP (35.157.40.177 → 18.199.102.66) with no Elastic IP attached; the site stayed reachable because DNS is Cloudflare-proxied and the origin record already reflected the new IP by the time of the check — the exact mechanism for that (fast Cloudflare propagation vs. some existing update-on-boot step) was not identified, so it should not be assumed reliable for a future ASG replacement event, which is a more disruptic IP swap than a manual resize.

Evaluated three options for the underlying IP-stability problem:
- **Current state (dynamic IP, relying on Cloudflare to stay in sync):** $0 extra cost, but the actual sync mechanism is unconfirmed — real risk once ASG exists.
- **Elastic IP:** confirmed via AWS Pricing API at the flat post-Feb-2024 rate, $0.005/hr (~$3.60/mo) for any public IPv4, attached or idle — replacing the old "first EIP free" rule. Solves the problem directly: same IP persists across instance replacement via an ASG lifecycle-hook re-association script, Cloudflare's origin record is set once and never needs to change again.
- **Route53:** confirmed via AWS Pricing API at $0.50/mo per hosted zone + $0.40/million queries (trivial at current traffic) — cheap in isolation, but redundant, since Cloudflare already provides the DNS/proxy layer Route53 would add. Route53 only earns its place if paired with health-check-triggered failover routing, which duplicates what an Elastic IP + lifecycle hook already solves more simply. Confirmed via `list-hosted-zones` (empty) and Cost Explorer ($0.00 for August) that Route53 isn't in use and cost nothing this cycle.

**Why this approach over alternatives:** Elastic IP is the direct fix (removes the need for anything to "stay in sync" at all) at negligible cost; Route53 was considered and rejected as redundant given Cloudflare is already the DNS layer in use.

**How to apply:** Add the Elastic IP only when the ASG work from the original 2026-08-13 entry is actually implemented — no cost or benefit to adding it while still on a single manually-managed instance. Tracked alongside the ASG item in `TODO.md`.

---

## 2026-09-07 — Root-caused and fixed Google OAuth login regression from AWS migration

**Problem:** Google OAuth login broken since Render→AWS migration. Root cause: `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GOOGLE_REDIRECT_URI` were never carried over to AWS Secrets Manager during the migration — `scripts/deploy/ec2-redeploy.sh` only fetched 6 secrets (DB creds, JWT, Anthropic/Google-AI/OpenAI keys), so the prod container ran with no Google OAuth env vars at all.

**Decision:**
- Created `pulse/app/GOOGLE_CLIENT_ID` and `pulse/app/GOOGLE_CLIENT_SECRET` in Secrets Manager (eu-central-1); added both ARNs to the `pulse-secret-read` IAM policy on `pulse-ec2-role`.
- `GOOGLE_REDIRECT_URI` is not a secret (public callback URL) — set directly as `googleOAuth.redirectUri` in `config/production.ts` (`https://pulserehab.app/api/v1/auth/google/callback`) instead of Secrets Manager, avoiding an unnecessary secret + IAM grant for non-sensitive config.
- Updated `ec2-redeploy.sh` to fetch the two new secrets and pass them as container env vars.
- Updated `docs/DEPLOYMENT.md` secrets table to match.

**Why this approach over alternatives:** Keeping `GOOGLE_REDIRECT_URI` out of Secrets Manager follows the existing pattern in this repo of only storing values that are actually sensitive (see `redirectUri` already being plain env-var-driven pre-migration) — matches user's explicit call mid-session.

**How to apply:** Still needed — verify `https://pulserehab.app/api/v1/auth/google/callback` is added to the Authorized redirect URIs list on the Google Cloud Console OAuth client (AWS-side CLI has no access to that). Old/previous OAuth client secret left untouched (not disabled) since it may still be in use by a preview server the user doesn't have access to — confirm before rotating.
