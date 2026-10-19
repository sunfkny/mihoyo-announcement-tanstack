# Mihoyo Announcement TanStack

米哈游游戏公告与卡池信息查看器，使用 React、TanStack Start、TanStack Router 和 TanStack Query 构建。

## Development

```bash
pnpm install
pnpm dev
```

## Inspection and Construction

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm build
pnpm preview
```

测试统一放在根目录 `tests/`，按源码目录组织；共享数据放在 `tests/fixtures/`，全局测试初始化位于 `tests/setup.ts`。

`pnpm test:coverage` 检查 `src/` 下手写 TypeScript 源码的覆盖率，每个文件的语句、分支、函数和行覆盖率都必须达到 100%。生成的路由树和纯类型声明不计入统计。HTML 报告位于 `coverage/index.html`。
