"""
ai_scientist_ollama.py — vendor/AI-Scientist/ai_scientist/llm.py に
Ollama サポートブロックを挿入するパッチスクリプト。

使い方:
    py -3 scripts/patches/ai_scientist_ollama.py <vendor/AI-Scientist のパス>

Download-Vendor.ps1 の post_patch として自動実行される。
"""
from __future__ import annotations

import sys
from pathlib import Path

_OLLAMA_BLOCK = '''\
    elif model.startswith("ollama/") or model == "ollama":
        # Ollama: OpenAI 互換 API (http://localhost:11434/v1)
        import os as _os
        _ollama_base = _os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434/v1")
        client = openai.OpenAI(api_key="ollama", base_url=_ollama_base)
        return client
'''

# DeepSeek ブロックの後に挿入するマーカー候補（llm.py のバージョン差異を吸収）
_MARKERS = [
    'elif "deepseek" in model',
    'elif model.startswith("deepseek")',
    'elif "gemini" in model',
]


def patch(target_dir: Path) -> None:
    llm_py = target_dir / "ai_scientist" / "llm.py"
    if not llm_py.exists():
        print(f"[PATCH] llm.py not found at {llm_py} — skipping")
        return

    src = llm_py.read_text(encoding="utf-8")

    if 'startswith("ollama/')' in src or '"ollama"' in src:
        print("[PATCH] Ollama block already present — skipping")
        return

    # 挿入位置を探す: elif deepseek / elif gemini ブロックの末尾
    insert_after = None
    for marker in _MARKERS:
        idx = src.find(marker)
        if idx == -1:
            continue
        # このブロックの終わりを探す: 次の elif / else / return で始まる行
        block_end = idx
        for line_start in range(idx, len(src)):
            if src[line_start] == "\n":
                # 次の行が elif/else/return ならここで止まる
                rest = src[line_start + 1:]
                stripped = rest.lstrip()
                if stripped.startswith(("elif ", "else:", "return ")):
                    block_end = line_start
                    break
        insert_after = block_end
        break

    if insert_after is None:
        # マーカーが見つからない場合: create_client 関数の最後の return の前に挿入
        idx = src.rfind("\n    return ")
        if idx == -1:
            print("[PATCH] Could not find insertion point — skipping")
            return
        insert_after = idx

    patched = src[:insert_after + 1] + _OLLAMA_BLOCK + src[insert_after + 1:]
    llm_py.write_text(patched, encoding="utf-8")
    print(f"[PATCH] Ollama block inserted into {llm_py}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: py -3 ai_scientist_ollama.py <vendor/AI-Scientist>")
        sys.exit(1)
    patch(Path(sys.argv[1]))
