# Decisions Log

Architecture/technical decisions made during sessions in this repo, with reasoning. Newest entries at the bottom. Split into `decisions/<subject>.md` once this file gets large, and index the split files here.

---

## 2026-08-10 — Check-in gap detection for intervention feedback

**Problem:** `contextBuilder.ts` builds AI intervention context from the last 7 check-in records (`checkInModel.getCheckIns(profileId, 7)`), ordered by `checkInDate desc`. If a user has a reporting gap (e.g. 3 weeks of silence), those 7 records can span a much longer real time window than 7 days. `determineTrendDirection` computed mood/pain deltas across that window with no gap awareness, so the AI could describe a "trend" that's actually two disconnected time periods — factually derived from real data, but temporally misleading.

**Decision:** Don't change the fetch (still `take: 7`, no date-range query, no extra DB round-trip). Instead, derive the gap from `checkInDate` values already in hand:
- Added `FEEDBACK_DETECTION.TREND.GAP_DAYS_THRESHOLD = 10` (`src/constants/feedback/detection.ts`).
- Added `gapDays` to `InterventionContext.trend` (`src/types/feedback.ts`), computed as the largest gap between consecutive check-ins in the window (`contextBuilder.ts: calculateMaxGapDays`).
- If `gapDays >= GAP_DAYS_THRESHOLD`, `determineTrendDirection` forces `'stable'` instead of computing a delta.
- `aiRenderer.ts` prompt includes an explicit note when the gap exceeds threshold, instructing the AI not to imply a continuous trend.

**Why this approach over alternatives:** A date-windowed query (e.g. `WHERE checkInDate >= now() - 7d`) would silently return fewer/zero records on a gap instead of surfacing it, and adds a query variant to reason about. Computing the gap from already-fetched data costs nothing extra and lets both the deterministic trend math and the AI prompt react to it explicitly.

**How to apply:** Any other consumer of `getCheckIns` history for trend/streak logic (e.g. `progressInsightsService.ts`, `recommendationsService.ts`) should be checked for the same blind spot if it computes deltas across a record window without checking `checkInDate` continuity.

Implementation uses the existing `dayInMs` from `src/constants/time.ts` for the ms→days conversion (caught in review — first pass hardcoded `1000 * 60 * 60 * 24` instead of checking for an existing time-constants file).
