#!/usr/bin/env bash
#
# Moltbot統合インストールスクリプト (Unix/macOS/Linux)
# 
# 使用方法:
#   ./scripts/install.sh              # 通常インストール
#   ./scripts/install.sh --clean      # クリーンビルド
#   ./scripts/install.sh --skip-check # 型チェックをスキップ
#   ./scripts/install.sh --prod       # 本番用ビルド

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Flags
CLEAN=false
SKIP_CHECK=false
PRODUCTION=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN=true
            shift
            ;;
        --skip-check)
            SKIP_CHECK=true
            shift
            ;;
        --prod|--production)
            PRODUCTION=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo ""
echo -e "${CYAN}========================================"
echo -e "  Moltbot 統合インストール"
echo -e "========================================${NC}"
echo ""

# --------------------------------
# 1. Prerequisites check
# --------------------------------
echo -e "${YELLOW}[1/5] 前提条件をチェック中...${NC}"

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js がインストールされていません。v22.12.0以上が必要です。${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
NODE_MAJOR=$(echo "$NODE_VERSION" | sed -E 's/v([0-9]+)\..*/\1/')
if (( NODE_MAJOR < 22 )); then
    echo -e "${RED}Node.js v22.12.0以上が必要です。現在: $NODE_VERSION${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} Node.js: $NODE_VERSION"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}  pnpm がインストールされていません。インストール中...${NC}"
    npm install -g pnpm
fi
PNPM_VERSION=$(pnpm --version)
echo -e "  ${GREEN}✓${NC} pnpm: $PNPM_VERSION"

# --------------------------------
# 2. Clean (optional)
# --------------------------------
if $CLEAN; then
    echo ""
    echo -e "${YELLOW}[2/5] クリーンアップ中...${NC}"
    
    if [ -d "$PROJECT_ROOT/dist" ]; then
        echo "  dist/ を削除中..."
        rm -rf "$PROJECT_ROOT/dist"
    fi
    if [ -d "$PROJECT_ROOT/node_modules" ]; then
        echo "  node_modules/ を削除中..."
        rm -rf "$PROJECT_ROOT/node_modules"
    fi
    echo -e "  ${GREEN}✓${NC} クリーンアップ完了"
else
    echo ""
    echo -e "\033[90m[2/5] クリーンアップをスキップ (--clean で有効化)${NC}"
fi

# --------------------------------
# 3. Install dependencies
# --------------------------------
echo ""
echo -e "${YELLOW}[3/5] 依存関係をインストール中...${NC}"

cd "$PROJECT_ROOT"
if $PRODUCTION; then
    pnpm install --prod
else
    pnpm install
fi
echo -e "  ${GREEN}✓${NC} 依存関係のインストール完了"

# --------------------------------
# 4. Type check (optional)
# --------------------------------
if ! $SKIP_CHECK; then
    echo ""
    echo -e "${YELLOW}[4/5] 型チェック中...${NC}"
    
    if npx tsc --noEmit; then
        echo -e "  ${GREEN}✓${NC} 型チェック完了 (0 errors)"
    else
        echo -e "${YELLOW}  ⚠ 型チェックにエラーがあります。ビルドは続行します。${NC}"
    fi
else
    echo ""
    echo -e "\033[90m[4/5] 型チェックをスキップ (--skip-check で指定)${NC}"
fi

# --------------------------------
# 5. Build
# --------------------------------
echo ""
echo -e "${YELLOW}[5/5] ビルド中...${NC}"

cd "$PROJECT_ROOT"
pnpm build
echo -e "  ${GREEN}✓${NC} ビルド完了"

# --------------------------------
# Summary
# --------------------------------
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  インストール完了!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${CYAN}使用方法:${NC}"
echo "  pnpm start            - 開発モードで起動"
echo "  pnpm gateway:dev      - Gateway開発サーバー起動"
echo "  pnpm tui              - TUIモード起動"
echo "  pnpm test             - テスト実行"
echo ""
echo -e "${CYAN}グローバルインストール (オプション):${NC}"
echo "  pnpm link --global    - moltbot コマンドをグローバルに登録"
echo ""
