#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
resolve-merge-conflicts.py
upstream/main との merge conflict を自動解消するスクリプト。

戦略:
- 独自ファイル (AGENTS.md, .gitignore カスタムセクション) → HEAD を優先
- 公式リファクタ (bundled.ts, skills tests, run-node.mjs) → upstream を優先
- 生成ファイル (bundled-*.generated.ts) → upstream 削除を受け入れ (動的ディスカバリーに移行)
- delete/modify (pnpm-lock, line tests) → upstream を受け入れ
"""

import subprocess
import sys
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]


def run(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess:
    print(f"  $ {' '.join(cmd)}")
    return subprocess.run(cmd, cwd=REPO_ROOT, check=check, capture_output=True, text=True)


def git_checkout_upstream(path: str) -> None:
    """upstream/main の版を採用 (content conflict)"""
    run(["git", "checkout", "upstream/main", "--", path])


def git_checkout_head(path: str) -> None:
    """HEAD の版を採用 (content conflict)"""
    run(["git", "checkout", "HEAD", "--", path])


def git_add(path: str) -> None:
    """ステージに追加"""
    run(["git", "add", path])


def git_rm(path: str) -> None:
    """ファイルを削除してステージ"""
    result = run(["git", "rm", "--cached", path], check=False)
    if result.returncode != 0:
        # already removed or not staged
        file = REPO_ROOT / path
        if file.exists():
            file.unlink()
        run(["git", "add", path], check=False)


def resolve_content_conflict(path: str, strategy: str) -> None:
    """content conflict を strategy ('ours'|'theirs') で解消"""
    print(f"\n[{strategy.upper()}] {path}")
    if strategy == "ours":
        git_checkout_head(path)
    elif strategy == "theirs":
        git_checkout_upstream(path)
    else:
        raise ValueError(f"Unknown strategy: {strategy}")
    git_add(path)


def accept_upstream_file(path: str) -> None:
    """'deleted in HEAD, modified in upstream' → upstream を採用"""
    print(f"\n[UPSTREAM FILE] {path}")
    git_checkout_upstream(path)
    git_add(path)


def accept_upstream_deletion(path: str) -> None:
    """'deleted in upstream, modified in HEAD' → upstream の削除を採用"""
    print(f"\n[UPSTREAM DELETION] {path}")
    file = REPO_ROOT / path
    if file.exists():
        file.unlink()
    result = run(["git", "rm", "--cached", "--", path], check=False)
    if result.returncode != 0:
        run(["git", "add", "--", path], check=False)


def resolve_gitignore() -> None:
    """
    .gitignore:
    - HEAD には独自エントリー多数 (IDE tools, hypura, identity 等)
    - upstream には changelog/fragments/ と .tmp/ の追加
    → HEAD を採用し、upstream の新規エントリーを追記
    """
    print("\n[CUSTOM] .gitignore")
    git_checkout_head(".gitignore")

    filepath = REPO_ROOT / ".gitignore"
    content = filepath.read_text(encoding="utf-8")

    # upstream が追加した行で HEAD に未存在のもの
    upstream_additions = [
        "# Deprecated changelog fragment workflow",
        "changelog/fragments/",
        "",
        "# Local scratch workspace",
        ".tmp/",
    ]

    lines_to_add = []
    for line in upstream_additions:
        if line not in content:
            lines_to_add.append(line)

    if lines_to_add:
        content = content.rstrip("\n") + "\n\n" + "\n".join(lines_to_add) + "\n"
        filepath.write_text(content, encoding="utf-8")
        print("  Added upstream entries to .gitignore")

    git_add(".gitignore")


def resolve_agents_md() -> None:
    """
    AGENTS.md:
    - HEAD は Sovereign カスタムマニフェスト (重要)
    - upstream は標準の openclaw repo ガイドライン (repo URL, CODEOWNERS 等)
    → HEAD を採用し、upstream の repo URL 行を先頭に追記
    """
    print("\n[CUSTOM] AGENTS.md")
    git_checkout_head("AGENTS.md")

    filepath = REPO_ROOT / "AGENTS.md"
    content = filepath.read_text(encoding="utf-8")

    # upstream の最初のセクション (repo リンクと CODEOWNERS ルール) を先頭コメントとして追加
    upstream_header = (
        "<!-- upstream: https://github.com/openclaw/openclaw -->\n"
        "<!-- Do not edit CODEOWNERS-restricted paths without explicit owner review. -->\n\n"
    )

    if "<!-- upstream:" not in content:
        content = upstream_header + content
        filepath.write_text(content, encoding="utf-8")
        print("  Added upstream repo reference comment to AGENTS.md")

    git_add("AGENTS.md")


def resolve_package_json() -> None:
    """
    package.json は自動マージ済み。
    format:check を upstream の --threads=1 付きに更新。
    check:max, setup, setup:dry は維持。
    """
    print("\n[FIXUP] package.json")
    filepath = REPO_ROOT / "package.json"
    content = filepath.read_text(encoding="utf-8")

    # format:check: upstream の --threads=1 + 既存の exclude オプション統合
    # oxfmtrc.jsonc が excludes を管理するので --exclude 引数は不要
    old_pattern = r'"format:check":\s*"oxfmt --check[^"]*"'
    new_val = '"format:check": "oxfmt --check --threads=1"'

    updated = re.sub(old_pattern, new_val, content)
    if updated != content:
        filepath.write_text(updated, encoding="utf-8")
        print("  Updated format:check to use --threads=1")
    else:
        print("  format:check already up to date")

    git_add("package.json")


def main() -> None:
    print("=" * 60)
    print("Merge Conflict Resolver -- upstream/main -> HEAD")
    print("=" * 60)

    # 1. content conflicts: upstream を採用 (公式改善を取り込む)
    upstream_wins = [
        "scripts/run-node.mjs",
        "src/agents/skills-install.download.test.ts",
        "src/agents/skills-status.test.ts",
        "src/agents/skills.buildworkspaceskillstatus.test.ts",
        "src/agents/skills.resolveskillspromptforrun.test.ts",
        "src/agents/skills/compact-format.test.ts",
        "src/channels/plugins/bundled.ts",
        "src/cli/skills-cli.formatting.test.ts",
    ]
    for path in upstream_wins:
        resolve_content_conflict(path, "theirs")

    # 2. content conflict: HEAD を採用 (独自コンテンツ)
    # AGENTS.md と .gitignore はカスタム処理
    resolve_agents_md()
    resolve_gitignore()

    # 3. delete/modify conflicts: upstream のファイルを採用
    upstream_files = [
        "extensions/line/src/channel.logout.test.ts",
        "extensions/line/src/channel.sendPayload.test.ts",
        "pnpm-lock.yaml",
    ]
    for path in upstream_files:
        accept_upstream_file(path)

    # 4. modify/delete conflicts: upstream の削除を採用 (動的ディスカバリーに移行)
    upstream_deletions = [
        "src/agents/skills/source.ts",
        "src/generated/bundled-plugin-entries.generated.ts",
        "src/plugins/bundled-plugin-metadata.generated.ts",
    ]
    for path in upstream_deletions:
        accept_upstream_deletion(path)

    # 5. package.json の format:check を更新
    resolve_package_json()

    # 6. 残存 conflict markers チェック
    print("\n\nChecking for remaining conflict markers...")
    result = run(
        ["git", "ls-files", "-u"],
        check=False,
    )
    if result.stdout.strip():
        print("⚠️  Still unresolved files:")
        print(result.stdout)
        sys.exit(1)
    else:
        print("✅ All conflicts resolved!")

    print("\n✅ Merge conflict resolution complete.")
    print("Next: review staged changes with 'git diff --cached', then commit.")


if __name__ == "__main__":
    main()
