# 実装ログ: Sovereign-Portal で Gateway/TUI/ブラウザが見えない・落ちる対策（worktree: clawdbot-main）

- **観測**: `logs/launcher/gateway-*.log` で Gateway が **exit 1**（チャンネル読み込み `Maximum call stack size exceeded`、Node **v25**）。`pnpm build` は Windows で **bash/canvas:a2ui** なしだと即死。
- **仮説**: (1) `.venv`/`uv` 無しでポータルが **FATAL exit** して未到達。(2) **Minimized** 子プロセスで気づかない。(3) `run-node` が増分ビルドと Gateway 起動で **二重に壊れた dist** を踏む。(4) Edge 無しでブラウザ起動失敗。
- **対応**: Python 必須を **Harness 専用**に限定；`Full`/`Ghost` で **tsdown + runtime-postbuild + stamp** の preflight → `OPENCLAW_RUNNODE_SKIP_BUILD=1`；Gateway/TUI を既定 **Normal**；Chrome フォールバック；`Start-Gateway` で **Node 25+ 警告**；`run-node` に **OPENCLAW_RUNNODE_SKIP_BUILD** 公式経路。

**なんｊ風**: ログ見たらもう死にかけやんけ。ポータルが Python 無いだけで全滅すんの草。Node 25 で無限再帰みたいなん出てたら **22 LTS 入れろ**やボケが。
