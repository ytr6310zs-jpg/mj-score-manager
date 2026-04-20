---
description: "Initial tasks for SDD bootstrapping and validation"
---

# Tasks: SDD Bootstrapping (Initial)

**Input**: `.specify/specs/001-brownfield-profile/spec.md`, `.github/specs/auto-extracted.*`

## Phase 0 — Preparation
- [ ] T001 Create feature branch `feat/sdd/initial-specs` and push branch (if ready)
- [x] T002 Ensure `.specify/` and Brownfield extension are present (done)

## Phase 1 — Bootstrap & Validate
- [ ] T003 Run Brownfield bootstrap to generate project-specific templates and spec artifacts
  - Command: (agent) `/speckit.brownfield.bootstrap` or CLI equivalent
  - Output: `.specify/specs/001-brownfield-profile/{spec.md,plan.md,tasks.md}` and any project-local templates
  - Acceptance: files created and placed under `.specify/specs/001-brownfield-profile/`
- [ ] T004 Validate generated artifacts
  - Command: (agent) `/speckit.brownfield.validate`
  - Acceptance: No structural mismatches; generated plan/tasks reference real file paths in repo

## Phase 2 — Review & Commit
- [ ] T005 Review generated spec artifacts and edit where necessary
- [ ] T006 Commit reviewed artifacts to `feat/sdd/initial-specs` and open PR to `develop`

## Phase 3 — CI & Guard
- [ ] T007 Add CI job or check that enforces presence of specs (example: `npm run check:required-files` or Spec Kit CI guard)
- [ ] T008 Create Issue/PR for CI guard (if not implemented) and assign reviewer

## Phase 4 — Trial Feature (SDD flow validation)
- [ ] T009 Pick a small P1 feature (e.g., player-add flow) and author `spec.md` for it
- [ ] T010 Generate `plan.md` + `tasks.md` for that feature using spec-kit flow
- [ ] T011 Implement according to tasks and validate acceptance tests

---

Notes:
- Tasks T003/T004 are Brownfield-specific — they can be executed via agent slash commands or manually by using the templates under `.specify/templates/`.
- After T006 (PR open), assign CI and an owner for SDD maintenance.
