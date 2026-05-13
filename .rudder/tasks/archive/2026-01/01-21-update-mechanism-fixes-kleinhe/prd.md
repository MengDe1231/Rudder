# PRD: Fix Update Mechanism Issues

## Overview

修复 `rudder update` 命令中发现的问题，确保迁移系统健壮可靠。

## Background

在实际使用 `rudder update` 过程中，发现了多个影响用户体验和系统可靠性的问题。

## Problems

| # | Issue | Priority | Impact |
|---|-------|----------|--------|
| 1 | rename-dir 哈希循环性能问题 | 🔴 High | 每次 `renameHash()` 调用都 load/save 整个文件，O(n) 次 I/O |
| 2 | 嵌套 rename-dir 迁移顺序 | 🟡 Medium | Parent 目录先于 child 重命名导致 child 被跳过 |
| 3 | "unknown" 版本显式处理 | 🟡 Medium | "unknown" 版本解析为 [0]，导致所有迁移都被应用 |
| 4 | 首次更新体验（空 hash 文件） | 🟡 Medium | 项目在 hash 追踪功能上线前安装，首次更新时所有文件被标记为"已修改" |
| 5 | 空目录残留清理 | 🟢 Low | 文件级 `rename` 迁移后，原目录可能变空但不会被删除 |
| 6 | 降级时的逆向迁移支持 | 🟢 Low | 降级时不会恢复旧文件结构 |

## Solution

### Phase 1: Critical & Medium Fixes

1. **Fix rename-dir Hash Loop**
   - 批量更新哈希，只做一次 load/save
   - Export `saveHashes` from `template-hash.ts`

2. **Handle Nested rename-dir Migrations**
   - 添加迁移排序函数，深层路径优先处理
   - `rename-dir` 优先于 `rename/delete`

3. **Handle "unknown" Version**
   - 检测 "unknown" 版本时跳过迁移
   - 提示用户再次运行 update

### Phase 2: UX Improvements

4. **First Update Experience**
   - 检测空 hash 文件
   - 提示用户这是首次 hash 追踪

5. **Clean Up Empty Directories**
   - 迁移后检查并清理空目录
   - 递归检查父目录

### Phase 3: Future Enhancements

6. **Reverse Migrations for Downgrade**
   - 暂不实现，记录为 Future Enhancement
   - 需要设计逆向迁移机制

## Files to Modify

| File | Changes |
|------|---------|
| `src/utils/template-hash.ts` | Export `saveHashes` |
| `src/commands/update.ts` | 所有修复逻辑 |

## Verification

### Test Scenarios

1. **rename-dir with many files** - 验证只有 1 次 load/save 周期
2. **Nested rename-dir** - 验证深层目录先处理
3. **Unknown version** - 验证警告提示且迁移被跳过
4. **First hash tracking** - 验证提示信息
5. **Empty directory cleanup** - 验证空目录被清理

## Status

- [x] Phase 1 实现完成
- [ ] Phase 2 部分实现（空目录清理待完善）
- [ ] Phase 3 延后

## Related

- Commit: `a8cfeb8` - fix(update): use hash tracking to distinguish user modifications
- Commit: `4e52ed5` - fix(update): complete migration system with full backup support
