# AGENTS.MD

Tele.Root policy/routing.Scoped `AGENTS.md` pre subtree.Skills own.Abbrev:WT,CB/TB,dep,rt,cfg,GH,beh,prf,cmt,pkg.

## Start

- Repo:`https://github.com/openclaw/openclaw`
- Replies:repo-root refs only (`extensions/telegram/src/index.ts:80`);no absolute paths or `~/`.
- Docs/user-visible:`pnpm docs:list`;read relevant docs only.
- Fix/triage:prove with source,tests,cur/shipped beh,dep contract.
- Dep-backed:upstream docs/source/types first;no API/default/error/timing guesses.
- Live verify when feasible;never print secrets.Missing deps:`pnpm install`,retry once,report first actionable error.
- CODEOWNERS:maint/refactor/tests ok;beh/product/security/ownership needs owner review.
- Wording:product/docs/UI/changelog say "plugin/plugins";`extensions/` internal.
- New channel/plugin/app/doc:update `.github/labeler.yml` + GH labels.New `AGENTS.md`:add sibling `CLAUDE.md` symlink;edit `AGENTS.md` only.

## Map

- Areas:core TS `src/`,`ui/`,`packages/`;plugins `extensions/`;SDK `src/plugin-sdk/*`;channels `src/channels/*`;loader `src/plugins/*`;protocol `src/gateway/protocol/*`;docs/apps `docs/`,`apps/`;installers sibling `../openclaw.ai`.
- Scoped guides:`extensions/`,`src/{plugin-sdk,channels,plugins,gateway,gateway/protocol,agents}/`,`test/helpers*/`,`docs/`,`ui/`,`scripts/`.

## Architecture

- Core plugin-agnostic;no bundled ids/defaults/policy when manifest/registry/capability contracts work.
- Boundaries:plugin->core only SDK/manifests/helpers/barrels;prod plugin no core/internal/other-plugin src or outside relatives;core/tests no `extensions/*/src/**`/`onboard.js`,use public barrels/SDK facade/generic contracts.
- Ownership/deps:owner plugin owns repair/detect/onboard/auth/defaults/provider beh;shared/core generic seams.Deps follow rt:plugin-only local;root only core imports/internalized bundled rt.
- Bundling:internal bundled plugins ship core dist;bundled facade only them.External plugins own pkg/deps,stay out of core dist;core uses registry-aware facade/generic contracts.Externalizing bundled:update excludes/catalogs/docs/tests;prove root before root-dep removal.
- Contracts:legacy cfg fix=`openclaw doctor --fix`;no startup/load migrations;rt paths canonical.New seams compat/docs/versioned;third-party plugins exist.Gateway additive;incompatible version/docs/client.Config aligned;retired keys retired;raw migration/doctor compat only.
- Channels/cache:channels in `src/channels/**`;authors get SDK;providers auth/catalog/rt hooks;core loop.Hot paths carry provider/model/channel/target/capability/attach;no broad rediscovery/caches;reuse rt,delete dupe lookups.Prompt cache sorts inputs;preserve transcript bytes.
- cmts:brief only for tricky,bug-prone,or previously buggy logic.

## Commands

- Runtime/PM:Node 22+;keep Node+Bun paths;repo defaults only,no swaps.
- Install/CLI/build:`pnpm install` (align Bun lock/patches if touched);`pnpm openclaw ...` or `pnpm dev`;`pnpm build`.
- Tests normal:`pnpm test <path-or-filter> [vitest args...]`,`pnpm test:changed`,`pnpm test:serial`,`pnpm test:coverage`;never raw `vitest`.
- Tests Codex WT:avoid local `pnpm test*`;use `node scripts/run-vitest.mjs <path-or-filter>` for tiny prf,or CB/TB.
- Checks normal:`pnpm check:changed`,`pnpm changed:lanes --json`,`pnpm check:changed --staged`,`pnpm check`.
- Checks Codex WT:avoid local `pnpm check*`;use `node scripts/crabbox-wrapper.mjs run ...--shell -- "pnpm check:changed"` so pnpm runs in Testbox.
- Extensions:`pnpm test:extensions`,`pnpm test extensions`,`pnpm test extensions/<id>`.
- Typecheck:`tsgo` lanes only (`pnpm tsgo*`,`pnpm check:test-types`);never add `tsc --noEmit`,`typecheck`,`check:types`.Format:`oxfmt`,not Prettier;use repo wrappers.
- Build before push if build output,packaging,lazy/module boundaries,dynamic imports,or published surfaces can change.

## Validation

- Use `$openclaw-testing` for test/CI choice;`$crabbox` for remote/full/E2E prf.
- Local only in healthy normal checkout:small/narrow tests,lints,format checks,type probes.
- Codex WTs:local `pnpm test*`,`pnpm check*`,`pnpm crabbox:run`,`scripts/committer` may trigger pnpm reconciliation/install prompts;prefer `node` wrappers and CB/TB.
- Broad prf (full suites/gates,Docker/pkg/E2E/live/cross-OS,Mac-heavy) => CB/TB.One/few files local;if command fans out,stop and move broad prf.
- Before handoff/push prove touched surface;before landing to `main`,issue prf plus full/broad prf unless clearly narrow.
- Blocked prf:state exactly what is missing/why.Do not land related failing format/lint/type/build/tests;if unrelated on latest `origin/main`,say so with scoped prf.
- Docs/changelog-only or CI/workflow metadata-only:`git diff --check` plus relevant docs/workflow sanity;escalate only if scripts/cfg/generated/pkg/rt beh changed.

## GitHub / PRs

- Maintainer issue/PR ops (review/triage/dupe/label/cmt/close/land/evidence):use `$openclaw-pr-maintainer`.Contributor PR create/refresh follows request;linked refs alone need no archive tooling.
- Refs:`gh pr view/diff` or `gh api`,not web.Prefer `gitcrawl`;stale/missing -> live `gh`,not contributor setup.Verify with `gh` before mutation.
- Bare URL/number:review/report;suggest actions;mutate only when asked.No unsolicited PR cmts/reviews/labels/retitles/rebases/fixups/landing;explicit close/duplicate/sweep/landing may need reason cmt.
- Rejection closes cluster unless told otherwise:cmt+close associated open issues/PRs (linked,dupes,workaround PRs,canonical issue).No hypothetical holds;new/reopen only concrete evidence.Close cmt:decision,why,alternative,change-evidence.
- PR review:bug/beh,URLs,surface,best fix,code/tests/CI/cur-or-shipped evidence.Issue/PR final:full GH URL last line.Changelog:landings/fixes need one unless pure test/internal;missing changelog not review finding.
- Verify/close:before merge post exact commands,CI/Testbox IDs,pre/post prf,gaps.Fixed on `main`:cmt prf + commit/PR,close.Post landing/close/sweep:search dupes;cmt prf + canon commit/PR/release before close.`ship` fix:after push,cmt prf + commit link,close.
- Landing/ship final:2-5 sentence recap with beh change,key files/surface,prf run,issue/PR state;not status/links only.
- GH cmts with backticks,`$`,shell snippets:heredoc/body file,not inline double-quoted `--body`.PR create:real body with Summary + Verification;mention refs,beh,prf.
- Parsed prf labels:`Behavior addressed`,`Real environment tested`,`Exact steps or command run after this patch`,`Evidence after fix`,`Observed result after fix`,`What was not tested`.
- PR artifacts/screenshots:attach to PR/cmt/external store;do not commit `.github/pr-assets`.CI polling:exact SHA,relevant checks,minimal fields;skip routine noise (`Auto response`,`Labeler`,docs agents,performance/stale);logs only after failure/completion/need.
- Maintainers may skip/ignore `Real behavior proof` when local tests or Crabbox verified beh;record prf in PR verification.
- `/landpr`:use `~/.codex/prompts/landpr.md`;do not idle on `auto-response` or `check-docs`.

## Code

- TS ESM strict.Avoid `any`;prefer real types,`unknown`,narrow adapters.No `@ts-nocheck`;lint suppressions intentional + explained.
- External boundaries:prefer `zod` or existing schema helpers.Runtime branching:discriminated unions/closed codes;no freeform strings or semantic sentinels (`?? 0`,empty object/string).
- Dynamic import:no static+dynamic import for same prod module;use `*.runtime.ts` lazy boundary.After edits:`pnpm build`;check `[INEFFECTIVE_DYNAMIC_IMPORT]`.
- Cycles:keep `pnpm check:import-cycles` + architecture/madge green.
- Classes:no prototype mixins/mutations;prefer inheritance/composition.Tests prefer per-instance stubs.
- cmts brief/non-obvious only.Split files around ~700 LOC when clarity/testability improves.
- Naming:**OpenClaw** product/docs;`openclaw` CLI/pkg/path/cfg.English:American spelling.

## Tests

- Vitest:colocated `*.test.ts`;e2e `*.e2e.test.ts`;example models `sonnet-4.6`,`gpt-5.5`;test GPT 5.5 preferred,5.4 ok;no GPT-4.x agent-smoke defaults.
- Prefer beh tests over workflow/docs string greps;policy reminders go in AGENTS/docs.Clean timers/env/globals/mocks/sockets/temp dirs/module state;`--isolate=false` safe.
- Prefer injection/narrow `*.runtime.ts` mocks over broad barrels or `openclaw/plugin-sdk/*`.Do not edit baseline/inventory/ignore/snapshot/expected-failure files to silence checks without explicit approval.
- No concur independent `pnpm test`/Vitest in one WT;cache races with `ENOTEMPTY`.Group one command or set distinct `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH`.
- Test workers max 16;memory pressure `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`;live `OPENCLAW_LIVE_TEST=1 pnpm test:live`;verbose `OPENCLAW_LIVE_TEST_QUIET=0`;guide `docs/reference/test.md`.

## Docs / Changelog

- Use `$openclaw-docs` for docs writing/review;docs change with beh/API.
- Codex harness upgrade (`extensions/codex/package.json` `@openai/codex`):refresh `docs/plugins/codex-harness.md` model snapshot from new harness `model/list`.
- Docs final answers:include relevant full `https://docs.openclaw.ai/...` URL(s);if issue/PR work too,GH URL last.
- Changelog:active `### Changes`/`### Fixes`,single-line bullets.Contributors do not edit `CHANGELOG.md`;maintainer/AI adds landing/merge entries.Contributor entries thank human `@author`;never bots,`@openclaw`,`@clawsweeper`,or `@steipete`;omit if unknown.

## Git

- Commit via `scripts/committer "<msg>" <file...>`;stage intended files only;commits conventional-ish,concise,grouped.
- No manual stash/autostash unless explicit.No branch/WT changes unless requested.
- `main`:no merge commits;rebase on latest `origin/main` before push;after one green run plus clean rebase sanity,do not chase moving `main`.
- User says `commit`:your changes only;`commit all`:all changes in grouped chunks;`push`:may `git pull --rebase` first;`ship it`:changelog if needed,commit intended changes,pull --rebase,push.
- Do not delete/rename unexpected files;ask if blocking,else ignore.Bulk PR close/reopen >5:ask with count/scope.

## Security / Release

- Never commit real phone numbers,videos,credentials,live cfg.
- Secrets:channel/provider creds in `~/.openclaw/credentials/`;model auth profiles in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
- Dep patches/overrides/vendor changes need explicit approval;`pnpm-workspace.yaml` patched deps use exact versions.Carbon pins owner-only:do not change `@buape/carbon` unless Shadow (`@thewilloftheshadow`,verified by `gh`) asks.
- Releases/publish/version bumps need explicit approval;use `$openclaw-release-maintainer`.GHSA/advisories:`$openclaw-ghsa-maintainer` / `$security-triage`;secret scanning:`$openclaw-secret-scanning-maintainer`.
- Beta tag/version match:`vYYYY.M.D-beta.N` -> npm `YYYY.M.D-beta.N --tag beta`.

## Platform / Ops

- Mobile:real iOS/Android devices before simulator/emulator;restart = rebuild/reinstall/relaunch,not kill/launch;SwiftUI Observation (`@Observable`,`@Bindable`) over new `ObservableObject`.
- Mac gateway:dev `pnpm gateway:watch`;managed `openclaw gateway restart/status --deep`;logs `./scripts/clawlog.sh`;no launchd/ad-hoc tmux.
- Ops:version bumps `$openclaw-release-maintainer`;Parallels `$openclaw-parallels-smoke`;Discord `$parallels-discord-roundtrip`;rebrand/migration/cfg warnings `openclaw doctor`.
- CB/WebVNC demos:desktop visible/windowed;no fullscreen remote browser unless video/capture output.ClawSweeper:`$clawsweeper`;deployed hooks may post one concise `#clawsweeper` note only when surprising/actionable/risky;if using message tool,reply `NO_REPLY`.
- Memory wiki:tiny digest;prefer `wiki_search`/`wiki_get`;verify contacts;source-class provenance for generated people facts.
- Never edit `node_modules`.Local-only `.agents` ignores:`.git/info/exclude`,not repo `.gitignore`.
- Provider tool schemas:prefer flat string enum helpers over `Type.Union([Type.Literal(...)])`;some providers reject `anyOf`.
- External messaging:no token-delta channel messages.Follow `docs/concepts/streaming.md`.
