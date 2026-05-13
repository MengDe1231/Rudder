# Release Process

> Cross-branch + submodule release flow for the Rudder monorepo.

---

## Overview

Rudder ships from multiple long-lived branches with two git submodules. Coordinating commits, version bumps, manifest continuity, and submodule pointer updates across branches is the most fragile part of a release. This guide is the single source of truth for that flow.

For migration manifest format itself, see `migrations.md`. This file covers the cross-branch / cross-submodule choreography around publishing.

---

## Branch and submodule ownership

| Repo / branch | Ships | Owner | Ship cadence |
|---|---|---|---|
| `Rudder` `main` | stable patches (0.5.x line) | maintainer | as-needed |
| `Rudder` `feat/v0.6.0-beta` | beta line (0.6.0-beta.x) | maintainer | as-needed; cherry-picks from main |
| `docs-site` (submodule, single `main`) | mintlify-rendered docs | shared | per-release or doc edits |
| `marketplace` (submodule, single `main`) | shared skills / agents / commands | shared | as-needed |

**Key invariant**: each release branch in the main `Rudder` repo has its own `package.json` version trajectory and its own set of `packages/cli/src/migrations/manifests/<version>.json` files. The submodules have a single `main` and are pointer-bumped from each Rudder branch independently.

---

## Submodule commit ordering — the "sub-repo first" rule

When a release touches both the Rudder main repo and one or more submodules, the commit/push order must be:

1. **First** — `cd <submodule>`, commit + push there. Capture the new submodule HEAD hash.
2. **Then** — back in the main repo, `git add <submodule-path>` to bump the submodule pointer, commit, push.

Reverse order (main repo first) breaks anyone who pulls + tries `git submodule update --init --recursive`: the main repo references a submodule SHA that doesn't yet exist on the submodule's remote.

### Wrong

```bash
# In main repo
git add docs-site marketplace
git commit -m "bump submodules"
git push origin main          # ← submodule SHAs not yet on submodule remote
# Later
cd docs-site && git push      # too late; downstream pulls already broken
```

### Correct

```bash
# Submodules first
cd docs-site
git add . && git commit -m "docs: …" && git push origin main
cd ../marketplace
git add . && git commit -m "feat: …" && git push origin main

# Then main repo bumps the pointers
cd ..
git add docs-site marketplace
git commit -m "chore: bump submodule pointers"
git push origin main
```

---

## Manifest continuity across branches

Each release branch maintains its own `packages/cli/src/migrations/manifests/<version>.json`. The CLI's update logic walks the chain of manifests between `fromVersion` and `toVersion`, so any version that was ever published from any branch must have a manifest reachable on the user's current branch. Otherwise `check-manifest-continuity` (run inside `pnpm release` / `release:beta`) fails.

### When the gap appears

Common cause: a stable patch was published from `main` (e.g. `0.5.7`), and now you're trying to ship `0.6.0-beta.5` from `feat/v0.6.0-beta`, but `0.5.7.json` doesn't exist on the beta branch. The continuity check sees `0.5.7` was published on the registry but the manifest is missing locally.

### Restore pattern

```bash
# On the branch that's missing the manifest:
git show <other-branch>:packages/cli/src/migrations/manifests/<v>.json \
    > packages/cli/src/migrations/manifests/<v>.json
git add packages/cli/src/migrations/manifests/<v>.json
git commit -m "chore: restore manifest <v>.json from <other-branch>"
# Then continue with the release flow
```

This must happen **before** the version bump commit, because `pnpm release` runs `check-manifest-continuity` as the very first step.

### Why we don't auto-merge manifests

Auto-merging manifest directories across branches sounds appealing but breaks: each branch's release line can have manifest entries that mention files that don't exist on the other branch (e.g. `feat/v0.6.0-beta` adds `commands/mem.ts` which doesn't exist on `main`). The migration system on the wrong branch would then try to track files it can't find. The manual restore-only-what-was-published rule keeps each branch's manifest set self-consistent.

---

## `pnpm release` / `pnpm release:beta` — internal sequence

Read from `packages/cli/package.json` scripts. The high-level flow:

1. **`check-manifest-continuity`** — fail fast if any published version's manifest is missing locally.
2. **`check-docs-changelog --type beta|rc|promote`** (beta+ only) — verify the docs-site changelog has a corresponding entry for the new version.
3. **`pnpm test`** — full test suite must be green.
4. **Pre-release stage commit** — `git add -A -- ':!docs-site' ':!marketplace'` then `git commit -m "chore: pre-release updates"`. The `:!docs-site` / `:!marketplace` exclusions prevent submodule pointer drift from being staged automatically — those bumps go in their own prior commit (see "sub-repo first" above).
5. **Version bump** — `pnpm version --no-git-tag-version <patch|prerelease …>` updates `package.json` only.
6. **Version commit** — `git commit -m "$VERSION"` (just the version string as the commit message; matches existing tag history).
7. **Tag** — `git tag "v$VERSION"`.
8. **Push** — `git push origin <branch> --tags`.
9. **npm publish** runs from the post-version hook on the package.

Any failure between step 3 and step 8 leaves the working tree in a recoverable state because no tag has been pushed yet.

### Why submodules are excluded from auto-staging

Step 4's `:!docs-site` / `:!marketplace` exclusions are deliberate. Submodule pointer bumps must:

- happen in a **separate prior commit** (the "sub-repo first" rule)
- be reviewed individually because they reference upstream SHAs

Auto-staging them inside the pre-release commit hides the pointer change inside an unrelated commit message and risks shipping a stale pointer.

---

## Branch protection and self-merge

`main` requires PR review approval (GitHub branch protection rule). For routine maintainer-driven merges:

```bash
gh pr create --base main --head <branch> --title "…" --body "…"
gh pr review <PR-number> --approve
gh pr merge <PR-number> --squash --delete-branch
```

Self-approval is acceptable for routine merges where the maintainer is the sole reviewer. **Do not use `--admin` to bypass protection** unless it's a genuine emergency (e.g. the 0.6.0-beta.4 emergency revert situation). When `--admin` is used, post-merge note in the PR body why.

`feat/v0.6.0-beta` and other long-lived feature branches generally don't have protection — they're maintainer-only working branches.

---

## Cherry-pick from main to feat/v0.6.0-beta

When `main` ships a stable patch (e.g. a 0.5.x bugfix), the same fix usually needs to land on the beta line too.

1. `git checkout feat/v0.6.0-beta`
2. `git cherry-pick <commits…>` in chronological order (oldest first).
3. Resolve conflicts. Common conflict source: files that exist only on the beta branch (e.g. `packages/cli/src/commands/mem.ts`) — main's cherry-pick won't touch them, but if a main-side fix touches a shared file that mem.ts also imports, you may get import-order conflicts. Cherry-pick **only goes main → beta**, never the reverse, because beta-only code can't be back-ported to main without removing the beta-specific bits.
4. Run `pnpm test` on the beta branch.
5. If `check-manifest-continuity` fails, restore any beta-only or main-only manifests using the pattern in "Manifest continuity across branches" above.
6. Bump the beta-line version (`pnpm version prerelease --preid=beta --no-git-tag-version`) and ship via `pnpm release:beta`.

### Why one-way cherry-pick

The asymmetry: beta has commands/files that main doesn't (e.g. mem.ts, OpenCode SQLite reader scaffolding even when degraded). Cherry-picking those onto main would either drag in code main isn't ready for, or require manually stripping them — which makes the cherry-pick no longer represent the original commit. By policy, beta-only changes that should also land on main are written as a **fresh commit on main**, not a cherry-pick from beta.

---

## Pre-release checklist

Before running `pnpm release` / `pnpm release:beta`:

- [ ] `git status` is clean except for intentional release changes.
- [ ] Submodule pointers (if changed) committed and pushed first; main repo references the new SHAs.
- [ ] `pnpm test` green locally.
- [ ] `pnpm lint && pnpm typecheck` green.
- [ ] `check-manifest-continuity` passes (otherwise restore missing manifests first).
- [ ] If breaking release: `migrationGuide` and `aiInstructions` populated in the new manifest (see `migrations.md` → "Breaking 版本必须提供 migrationGuide + aiInstructions").
- [ ] If beta+ release: docs-site changelog entry exists for the new version.
- [ ] Branch protection respected (PR + approval, not `--admin`).
- [ ] Cherry-picks from main applied if relevant.

---

## Cross-references

- Manifest format and migration types — `migrations.md`
- Soft-degrade pattern (used by features that depend on optional native deps) — `quality-guidelines.md` → "Native dependency policy"
- Platform-specific session-start hook contracts (touched by some releases) — `platform-integration.md`
