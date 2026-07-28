#!/usr/bin/env bash
# 取得／更新設計上游 doping-design-book（唯讀）。
#
# 唯讀鐵律：本專案**不得**寫入上游。本腳本刻意不含任何 commit/push 路徑——
# 要改上游請走 docs/design-book/proposals/ 提案 → PR → 合併後才回寫台帳。
#
# 用法：
#   ./scripts/design-book.sh                      # clone 或更新到最新
#   ./scripts/design-book.sh --show 4-patterns/03-hard-lock   # 直接印出某篇規範
#   ./scripts/design-book.sh --list               # 列出可讀的章節
#   DESIGN_BOOK_DIR=/somewhere ./scripts/design-book.sh       # 自訂位置
#
# 預設放在 repo **外部**（../doping-design-book），不進本專案版控、不污染工作區。
set -euo pipefail

REPO_URL="https://github.com/kielchang/doping-design-book"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIR="${DESIGN_BOOK_DIR:-$(dirname "$HERE")/doping-design-book}"

fetch() {
  if [ -d "$DIR/.git" ]; then
    echo "↻ 更新上游：$DIR"
    git -C "$DIR" fetch --depth 1 origin HEAD >/dev/null 2>&1
    git -C "$DIR" reset --hard FETCH_HEAD >/dev/null 2>&1
  else
    echo "↓ 取得上游：$REPO_URL → $DIR"
    git clone --depth 1 "$REPO_URL" "$DIR"
  fi
  local head
  head="$(git -C "$DIR" log -1 --format='%h %s' 2>/dev/null || echo '（空 repo）')"
  echo "✓ 上游版本：$head"
}

case "${1:-}" in
  --show)
    [ -n "${2:-}" ] || { echo "用法：$0 --show <章節路徑>（例：4-patterns/03-hard-lock）" >&2; exit 1; }
    [ -d "$DIR/.git" ] || fetch
    for ext in .mdx .md ""; do
      f="$DIR/book/docs/$2$ext"
      [ -f "$f" ] && { cat "$f"; exit 0; }
    done
    echo "找不到：$2（試試 $0 --list）" >&2; exit 1
    ;;
  --list)
    [ -d "$DIR/.git" ] || fetch
    if [ -d "$DIR/book/docs" ]; then
      (cd "$DIR/book/docs" && find . -name '*.md*' | sed 's|^\./||; s|\.mdx\?$||' | sort)
    else
      echo "上游尚無 book/docs（repo 可能還是空的）" >&2; exit 1
    fi
    ;;
  "")
    fetch
    echo
    echo "讀規範：$0 --list ／ $0 --show <章節>"
    echo "符合性台帳：docs/design-book/conformance.md"
    echo "要改上游：寫 docs/design-book/proposals/ 提案 → PR（本專案不直接寫入上游）"
    ;;
  *)
    echo "未知參數：$1（可用：--show <章節> / --list / 無參數＝更新）" >&2; exit 1
    ;;
esac
