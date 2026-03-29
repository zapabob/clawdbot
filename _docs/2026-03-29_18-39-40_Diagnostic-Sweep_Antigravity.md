2026-03-29 18:39:40,587 [INFO] # Sovereign Parallel Check Sweep (Threads: 12)
2026-03-29 18:39:40,588 [INFO] Root: C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main
2026-03-29 18:39:40,588 [INFO] ----------------------------------------
2026-03-29 18:39:40,628 [INFO] [START] Conflict Markers
2026-03-29 18:39:40,629 [INFO] [START] Host Env Policy
2026-03-29 18:39:40,629 [INFO] [START] Base Config Schema
2026-03-29 18:39:40,630 [INFO] [START] Plugin Metadata
2026-03-29 18:39:40,633 [INFO] [START] Auth Env Vars
2026-03-29 18:39:40,639 [INFO] [START] Runtime Deps
2026-03-29 18:39:40,654 [INFO] [START] Formatting
2026-03-29 18:39:40,654 [INFO] [START] TSGO Lint
2026-03-29 18:39:40,658 [INFO] [START] Plugin SDK Exports
2026-03-29 18:39:40,659 [INFO] [START] Core Lint (Oxlint)
2026-03-29 18:39:40,661 [INFO] [START] Lint: Random Msg
2026-03-29 18:39:40,670 [INFO] [START] Lint: Agnostic Boundaries
2026-03-29 18:39:42,849 [INFO] [DONE] Plugin SDK Exports (2.18s)
2026-03-29 18:39:42,850 [INFO] [START] Lint: Raw Channel Fetch
2026-03-29 18:39:43,168 [INFO] [DONE] Plugin Metadata (2.54s)
2026-03-29 18:39:43,168 [INFO] [START] Lint: Ingress Owner
2026-03-29 18:39:43,325 [INFO] [DONE] Runtime Deps (2.69s)
2026-03-29 18:39:43,326 [INFO] [START] Lint: HTTP Handlers
2026-03-29 18:39:43,488 [INFO] [DONE] Host Env Policy (2.86s)
2026-03-29 18:39:43,488 [INFO] [START] Lint: Monolithic SDK
2026-03-29 18:39:44,558 [INFO] [DONE] Auth Env Vars (3.92s)
2026-03-29 18:39:44,559 [INFO] [START] Lint: Ext Src Imports
2026-03-29 18:39:45,461 [INFO] [DONE] Lint: Agnostic Boundaries (4.79s)
2026-03-29 18:39:45,461 [INFO] [START] Lint: Ext Test Core
2026-03-29 18:39:46,536 [INFO] [DONE] Lint: Random Msg (5.87s)
2026-03-29 18:39:46,537 [INFO] [START] Lint: Ext Imports
2026-03-29 18:39:48,109 [INFO] [DONE] Lint: Ingress Owner (4.94s)
2026-03-29 18:39:48,110 [INFO] [START] Lint: SDK Subpaths
2026-03-29 18:39:54,422 [INFO] [DONE] Lint: Raw Channel Fetch (11.57s)
2026-03-29 18:39:54,423 [INFO] [START] Lint: Ext SDK Boundary
2026-03-29 18:39:58,910 [INFO] [DONE] Lint: HTTP Handlers (15.58s)
2026-03-29 18:39:58,913 [INFO] [START] Lint: Ext SDK Internal
2026-03-29 18:40:03,987 [INFO] [DONE] Lint: Ext Src Imports (19.43s)
2026-03-29 18:40:03,987 [INFO] [START] Lint: Ext Relative
2026-03-29 18:40:04,226 [INFO] [DONE] Lint: Ext Imports (17.69s)
2026-03-29 18:40:04,226 [INFO] [START] Lint: Web Search
2026-03-29 18:40:05,743 [ERROR] [FAIL] Formatting (25.09s)
2026-03-29 18:40:05,743 [INFO] [START] Lint: Webhook Body
2026-03-29 18:40:05,900 [INFO] [DONE] Lint: Monolithic SDK (22.41s)
2026-03-29 18:40:05,900 [INFO] [START] Lint: Auth Store
2026-03-29 18:40:08,781 [INFO] [DONE] Lint: Webhook Body (3.04s)
2026-03-29 18:40:08,782 [INFO] [START] Lint: Account Scope
2026-03-29 18:40:09,152 [INFO] [DONE] Lint: Ext Test Core (23.69s)
2026-03-29 18:40:09,152 [INFO] [START] PowerShell Analysis
2026-03-29 18:40:10,607 [INFO] [DONE] Lint: Auth Store (4.71s)
2026-03-29 18:40:10,988 [INFO] [DONE] Lint: Account Scope (2.21s)
2026-03-29 18:40:18,469 [INFO] [DONE] Lint: Ext Relative (14.48s)
2026-03-29 18:40:19,554 [INFO] [DONE] Lint: Web Search (15.33s)
2026-03-29 18:40:21,249 [ERROR] [FAIL] Conflict Markers (40.62s)
2026-03-29 18:40:26,254 [INFO] [DONE] Lint: Ext SDK Internal (27.34s)
2026-03-29 18:40:26,607 [INFO] [DONE] Lint: Ext SDK Boundary (32.18s)
2026-03-29 18:40:27,995 [INFO] [DONE] Lint: SDK Subpaths (39.89s)
2026-03-29 18:40:37,502 [ERROR] [FAIL] PowerShell Analysis (28.35s)
2026-03-29 18:40:52,388 [INFO] [DONE] Base Config Schema (71.76s)
2026-03-29 18:41:08,907 [INFO] [DONE] Core Lint (Oxlint) (88.25s)
2026-03-29 18:41:30,583 [INFO] [DONE] TSGO Lint (109.93s)
2026-03-29 18:41:30,585 [INFO] ----------------------------------------
2026-03-29 18:41:30,585 [INFO] Sweep Completed in 110.00s
2026-03-29 18:41:30,585 [INFO] Summary: 25/28 Passed
2026-03-29 18:41:30,585 [WARNING] Critical Failures Detected: 3
2026-03-29 18:41:30,585 [WARNING] - Formatting
2026-03-29 18:41:30,585 [WARNING] | package.json (16ms)
2026-03-29 18:41:30,586 [WARNING] |
2026-03-29 18:41:30,586 [WARNING] | Format issues found in above 3 files. Run without `--check` to fix.
2026-03-29 18:41:30,586 [WARNING] | Finished in 18577ms on 10420 files using 12 threads.
2026-03-29 18:41:30,586 [WARNING] |  ELIFECYCLE  Command failed with exit code 1.
2026-03-29 18:41:30,628 [WARNING] - Conflict Markers
2026-03-29 18:41:30,629 [WARNING] | Found unresolved merge conflict markers:
2026-03-29 18:41:30,629 [WARNING] | - .openclaw-desktop\python\Lib\pydoc_data\topics.py:12100
2026-03-29 18:41:30,629 [WARNING] | - .openclaw-desktop\python\Lib\test\test_optparse.py:1427
2026-03-29 18:41:30,629 [WARNING] - PowerShell Analysis
2026-03-29 18:41:30,629 [WARNING] | At C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\scripts\launchers\parallel-analyzer.ps1:23 char:1
2026-03-29 18:41:30,629 [WARNING] | + $PendingFiles = [System.Collections.Generic.Queue[string]]::new($File ...
2026-03-29 18:41:30,629 [WARNING] | + ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
2026-03-29 18:41:30,629 [WARNING] | + CategoryInfo : NotSpecified: (:) [], ParentContainsErrorRecordException
2026-03-29 18:41:30,629 [WARNING] | + FullyQualifiedErrorId : MethodCountCouldNotFindBest
