#!/bin/bash
# OpenClaw Manager 移动端重构进度检查脚本

PROJECT_DIR="/home/chenyi/.openclaw/workspace/projects/openclaw-manager"
LOG_FILE="/tmp/mobile-refactor-progress.log"
TASK_FILE="$PROJECT_DIR/mobile-refactor-tasks.md"

echo "=== 移动端重构进度检查 ===" >> $LOG_FILE
echo "时间: $(date)" >> $LOG_FILE
echo "" >> $LOG_FILE

# 检查最近的 Git 提交
echo "最近提交:" >> $LOG_FILE
cd $PROJECT_DIR
git log --oneline -5 >> $LOG_FILE
echo "" >> $LOG_FILE

# 检查移动端相关的 CSS 修改
echo "移动端 CSS 统计:" >> $LOG_FILE
grep -c "@media" index.html >> $LOG_FILE
echo "" >> $LOG_FILE

# 检查任务清单进度
echo "任务进度:" >> $LOG_FILE
grep -c "\[x\]" $TASK_FILE >> $LOG_FILE
grep -c "\[ \]" $TASK_FILE >> $LOG_FILE
echo "" >> $LOG_FILE

echo "================================" >> $LOG_FILE
echo "" >> $LOG_FILE
