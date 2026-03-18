# Codex Agent Instructions

This repository uses a PR-first workflow for code changes.

Read and follow the detailed workflow in [`.github/CODEX_WORKFLOW.md`](./.github/CODEX_WORKFLOW.md).

## Required Operating Rules

1. Treat every code change as a PR-sized unit of work.
2. Start new functionality by writing or updating tests first whenever practical.
3. For large changes, first write a detailed PR breakdown plan, then implement one PR-sized slice at a time.
4. Before considering work complete, review your own diff, run the build, and run all relevant tests.
5. Keep the result as a single coherent changeset for that PR-sized slice.

## Repository Verification Commands

- Build: `npm run build`
- Lint: `npm run lint`
- Type check: `npm run ts:check`
- Tests: no test script is currently defined in `package.json`; add and run focused tests when introducing new behavior

## Test Fixtures

- If a test needs real save data, use fixtures from [`test_save`](./test_save).
- Prefer the smallest fixture that covers the scenario.
- Use [`test_save/EXPEDITION_0.sav`](./test_save/EXPEDITION_0.sav) or the timestamped snapshots under [`test_save/Backup`](./test_save/Backup) when parser or save-state behavior needs realistic inputs.

If a verification step cannot run, say exactly why and what remains unverified.
