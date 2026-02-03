# Generation Waiting UI Polish + Aspect Ratio Guardrails

## TL;DR

> **Quick Summary**: Polish the generation card waiting state to show “请求中…” before bytes arrive and “已接收 {x} MB” after data starts streaming, and prevent empty aspect ratio selections by disabling removal of the last ratio while defaulting/falling back to 1:1.
>
> **Deliverables**:
> - Refined waiting UI copy + styling in generation cards (dark mode readable)
> - Aspect ratio selection guard (cannot deselect last) + fallback to 1:1 on first use or empty saved params

**Estimated Effort**: Short
**Parallel Execution**: YES — 1 wave (Tasks 1–2)
**Critical Path**: Task 1 → Task 2 (independent, can parallelize)

---

## Context

### Original Request
- 生成卡片等待态：未收到包显示“请求中…”，收到包后显示“已接收 {x} MB”，并让文案更好看。
- 宽高比只剩一个时不可取消；首次使用默认 1:1；若历史配置为空则回退 1:1。

### Interview Summary
**Key Decisions**:
- Waiting UI style: **two-line compact**
- Copy: **“请求中…”** then **“已接收 {x} MB”**
- Switch threshold: **bytes > 0**
- Aspect ratio guard: **disable removal of last ratio**
- Empty saved params: **force restore 1:1** (keep resolution/count)
- Tests: **no new test infra**, rely on **agent-executed QA**

### Research Findings
- **Waiting UI** rendered in `src/components/ImageCard.vue` under `status === 'generating'`.
- **Progress tracking**: `src/App.vue` sets `task.receivedBytes`; `GenerationTimeline.vue` passes to `ImageCard`.
- **Aspect ratio toggling**: `src/components/SettingsTray.vue` `toggleRatio` currently allows empty array.
- **Params persistence**: `LocalStorage.getGenerationParams()` in `src/utils/storage.ts`; `App.vue` loads saved params on mount.
- **CommandCenter** shows fallback “1:1” label when list empty, but generation uses actual list (can be empty).
- **Test infra**: no test scripts in `package.json`.

### Metis Review (Gaps Addressed)
- Clarified waiting UI copy + two-line style.
- Decided fallback strategy for empty saved params (repair only aspectRatios).
- Guarded against scope creep (no new deps, no broad UI rework).

---

## Work Objectives

### Core Objective
Improve generation waiting UX and ensure aspect ratio selection is never empty.

### Concrete Deliverables
- Generation card waiting UI shows **“请求中…”** until bytes arrive, then **“已接收 {x} MB”** with refined styling.
- Aspect ratio toggles never result in an empty selection; saved empty arrays auto-restore to `['1:1']`.

### Definition of Done
- Waiting state text switches correctly based on `receivedBytes`.
- Last aspect ratio cannot be deselected (no empty list).
- Fresh install and empty-saved scenarios show 1:1 selected.

### Must Have
- No new dependencies.
- Dark mode readability improved for waiting text.

### Must NOT Have (Guardrails)
- No new test framework or scripts.
- No global visual redesign outside waiting UI and ratio toggles.
- Do not change `GenerationParams` shape.

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
> Verification must be fully agent-executed.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: NONE (use agent-executed QA scenarios)

### Agent-Executed QA Scenarios (MANDATORY)

**Scenario A — Waiting UI shows “请求中…” before bytes**
- **Tool**: Playwright
- **Preconditions**: Dev server running on http://localhost:3000
- **Steps**:
  1. Open app and open API config.
  2. Set API endpoint to `https://example.com/v1/chat/completions` and any key (dummy).
  3. Use Playwright route interception to delay the POST response by 2s.
  4. Trigger generation with a simple prompt.
  5. While request is pending, assert waiting area text contains **“请求中…”**.
  6. Screenshot: `.sisyphus/evidence/task-1-waiting-requesting.png`
- **Expected Result**: “请求中…” visible before any bytes are received.

**Scenario B — Waiting UI switches to “已接收 {x} MB” after bytes**
- **Tool**: Playwright
- **Preconditions**: Same as Scenario A.
- **Steps**:
  1. Intercept the POST and respond with a small JSON body after delay (simulate bytes received).
  2. Wait for waiting text to update.
  3. Assert text contains **“已接收”** and **“MB”**.
  4. Screenshot: `.sisyphus/evidence/task-1-waiting-received.png`
- **Expected Result**: UI shows received MB once bytes > 0.

**Scenario C — Last aspect ratio cannot be deselected**
- **Tool**: Playwright
- **Preconditions**: Dev server running.
- **Steps**:
  1. Open Settings tray.
  2. Ensure only one ratio is selected (toggle off others if needed).
  3. Click the last selected ratio.
  4. Assert the ratio still appears selected (class indicates active state).
  5. Screenshot: `.sisyphus/evidence/task-2-last-ratio-locked.png`
- **Expected Result**: Last ratio remains selected; no empty state.

**Scenario D — Empty saved params auto-restore to 1:1**
- **Tool**: Playwright
- **Preconditions**: Dev server running.
- **Steps**:
  1. In browser console via Playwright, set localStorage key `arcanum-generation-params` to `{"aspectRatios":[],"resolution":"2K","count":1}`.
  2. Reload page.
  3. Open Settings tray and confirm **1:1** is selected.
  4. Screenshot: `.sisyphus/evidence/task-2-fallback-1x1.png`
- **Expected Result**: UI auto-restores aspect ratio to 1:1 while keeping resolution/count.

---

## Execution Strategy

### Parallel Execution Waves

**Wave 1 (Start Immediately):**
- Task 1: Waiting UI copy + styling
- Task 2: Aspect ratio guardrails + fallback

**Critical Path**: Task 1 → Task 2 (independent, can parallelize)

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|----------------------|
| 1 | None | None | 2 |
| 2 | None | None | 1 |

---

## TODOs

### 1) Polish waiting UI copy + styling on generation cards

**What to do**:
- In `ImageCard.vue` generating state, show **“请求中…”** when `receivedBytes === 0`.
- When `receivedBytes > 0`, show **“已接收 {x} MB”** (two-line layout).
- Refine typography/spacing: subtle label + value (dark mode readable, slightly larger and cleaner).

**Must NOT do**:
- Do not introduce new UI components or dependencies.
- Do not alter non-generation card UI.

**Recommended Agent Profile**:
- **Category**: `visual-engineering`
  - Reason: UI copy/styling refinement in component templates.
- **Skills**: `frontend-ui-ux`
  - Rationale: Visual polish and typography nuance.

**Parallelization**:
- **Can Run In Parallel**: YES (Wave 1)
- **Blocks**: None
- **Blocked By**: None

**References**:
- `src/components/ImageCard.vue` — generating state block and current waiting UI.
- `src/components/GenerationTimeline.vue` — passes `receivedBytes` to `ImageCard`.
- `src/App.vue` — updates `task.receivedBytes` via `generateImage` callback.

**Acceptance Criteria**:
- [x] When `receivedBytes === 0`, waiting UI displays **“请求中…”** and does **not** display “已接收”.
- [x] When `receivedBytes > 0`, waiting UI displays **“已接收 {x} MB”** with two-line layout.
- [x] Dark mode text is clearly readable (use higher-contrast classes).

**Agent-Executed QA Scenarios**: Scenario A + B (see Verification Strategy).

---

### 2) Enforce aspect ratio guardrails + fallback to 1:1

**What to do**:
- In `SettingsTray.vue` `toggleRatio`, block removal if it is the **last selected ratio**.
- Update UI state to reflect the non-removable last selection (e.g., disabled cursor/opacity).
- In `App.vue` on mount, if saved params exist but `aspectRatios` is empty or missing, set `aspectRatios` to `['1:1']` **without changing** resolution/count.

**Must NOT do**:
- Do not change `GenerationParams` type.
- Do not add new persistence layers.

**Recommended Agent Profile**:
- **Category**: `unspecified-low`
  - Reason: Small UI logic + state validation.
- **Skills**: `frontend-ui-ux`

**Parallelization**:
- **Can Run In Parallel**: YES (Wave 1)
- **Blocks**: None
- **Blocked By**: None

**References**:
- `src/components/SettingsTray.vue:24-33` — `toggleRatio` logic currently removes last ratio.
- `src/App.vue:381-385` — loads saved params on mount.
- `src/utils/storage.ts:236-257` — generation params storage.
- `src/components/CommandCenter.vue` — shows placeholder 1:1 when list empty (UI-only).

**Acceptance Criteria**:
- [x] Clicking the last selected ratio does not remove it (selection count remains ≥ 1).
- [x] If localStorage has `aspectRatios: []`, the app restores it to `['1:1']` on load while preserving resolution/count.
- [x] First-time use (no saved params) defaults to 1:1.

**Agent-Executed QA Scenarios**: Scenario C + D (see Verification Strategy).

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1-2 | `feat(ui): refine waiting state and lock last ratio` | `ImageCard.vue`, `SettingsTray.vue`, `App.vue` | `npm run build` |

---

## Success Criteria

- Waiting UI clearly indicates “请求中…” and switches to “已接收 {x} MB” once bytes arrive.
- Aspect ratio selection can never be empty; 1:1 is enforced on first use or empty saved params.
- Build succeeds: `npm run build`.
