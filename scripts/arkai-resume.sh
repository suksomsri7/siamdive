#!/usr/bin/env bash
# arkai-resume.sh — Recovery script for Ark AI v2 implementation
# Run when: starting new session, after server restart, after long break
# Usage: bash scripts/arkai-resume.sh

set -e

cd "$(dirname "$0")/.."
REPO_ROOT="$(pwd)"
MEMORY_DIR="$HOME/.claude/projects/-root/memory"

cyan='\033[0;36m'; green='\033[0;32m'; yellow='\033[0;33m'; red='\033[0;31m'; bold='\033[1m'; reset='\033[0m'

print_section() { echo -e "\n${cyan}${bold}━━━ $1 ━━━${reset}"; }
print_ok()      { echo -e "${green}✓${reset} $1"; }
print_warn()    { echo -e "${yellow}⚠${reset} $1"; }
print_err()     { echo -e "${red}✗${reset} $1"; }

echo -e "${bold}🔄 Ark AI v2 Recovery Script${reset}"
echo "Repo: $REPO_ROOT"
echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"

# 1. Memory state
print_section "1. Memory state (Current State)"
PROGRESS_FILE="$MEMORY_DIR/project_siamdive_ark_ai_v2_progress.md"
if [ -f "$PROGRESS_FILE" ]; then
  print_ok "Progress file exists"
  echo
  awk '/^## Current State/,/^---$/' "$PROGRESS_FILE" | head -20
else
  print_err "Progress file missing — check $PROGRESS_FILE"
fi

# 2. Git branch + recent commits
print_section "2. Git state"
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "(detached)")
echo -e "Current branch: ${bold}$CURRENT_BRANCH${reset}"
echo
echo "Recent arkai-v2 commits:"
git log --oneline -10 --grep="arkai-v2" 2>/dev/null || echo "  (no arkai-v2 commits yet)"

# 3. Uncommitted work
print_section "3. Uncommitted changes"
UNCOMMITTED=$(git status --short 2>/dev/null | wc -l | tr -d ' ')
if [ "$UNCOMMITTED" = "0" ]; then
  print_ok "Working tree clean"
else
  print_warn "$UNCOMMITTED file(s) uncommitted — possible WIP from last session"
  git status --short | head -20
fi

# 4. Open PRs
print_section "4. Open arkai-v2 PRs"
if command -v gh &> /dev/null; then
  gh pr list --state open --search "arkai-v2 in:title" 2>/dev/null || print_warn "gh CLI not authenticated or no PRs"
else
  print_warn "gh CLI not installed — check https://github.com/suksomsri7/siamdive/pulls manually"
fi

# 5. Vercel deployments (manual — CLI may hang)
print_section "5. Vercel deployments"
print_warn "Auto-check skipped (CLI hangs without auth). Visit: https://vercel.com/dashboard"

# 6. Prisma migration status (with hard timeout, source .env if exists)
print_section "6. Prisma migration status"
if [ -f "package.json" ] && command -v bun &> /dev/null; then
  ENV_PREFIX=""
  [ -f ".env" ] && ENV_PREFIX="set -a; . ./.env; set +a;"
  timeout 15 bash -c "$ENV_PREFIX PATH=\"/root/.bun/bin:\$PATH\" bunx prisma migrate status" 2>&1 | head -20 \
    || print_warn "Skipped or timed out (run manually: bunx prisma migrate status)"
else
  print_warn "Bun/package.json not found"
fi

# 7. TODO progress
print_section "7. TODO progress (Ark AI v2)"
TODO_FILE="$REPO_ROOT/ARK_AI_V2_TODO.md"
if [ -f "$TODO_FILE" ]; then
  TOTAL=$(grep -cE '^- \[[ x]\]' "$TODO_FILE" || echo 0)
  DONE=$(grep -cE '^- \[x\]' "$TODO_FILE" || echo 0)
  PENDING=$((TOTAL - DONE))
  echo -e "Tasks: ${green}$DONE done${reset} / ${yellow}$PENDING pending${reset} / total $TOTAL"
  echo
  echo "Next 5 pending tasks:"
  grep -E '^- \[ \]' "$TODO_FILE" | head -5
else
  print_err "TODO file missing — check $TODO_FILE"
fi

# 8. Quick reference
print_section "Quick references"
echo "  Master plan:    $MEMORY_DIR/project_siamdive_ark_ai_v2.md"
echo "  v1 audit:       $MEMORY_DIR/project_siamdive_ark_ai_v1_audit.md"
echo "  Progress:       $PROGRESS_FILE"
echo "  TODO:           $TODO_FILE"
echo
echo -e "${bold}Next action:${reset} Read 'Current State' section above → continue from In Progress / next pending task"
echo
