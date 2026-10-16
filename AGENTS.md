# 项目规范

- 注释只解释代码做什么或为什么存在；不要使用“改进”“更好”“新增”“增强”等措辞，不要描述旧实现，也不要写指导开发者照做的注释。

## 工具与命令

- 使用 `pnpm` 管理依赖和运行脚本。Node.js 版本需为 24 或以上。
- 使用 `rg` 搜索文件和文本。需要 Python 工具时使用 `uv`，不要使用 `pip`。
- `pnpm dev` 启动开发服务。
- `pnpm lint` 运行 ESLint 检查。
- `pnpm format` 使用 ESLint 自动修复和格式化代码。项目不使用独立的 Prettier 配置。
- `pnpm typecheck` 运行 TypeScript 类型检查。
- `pnpm check` 同时运行 lint 和类型检查。代码修改后需通过此检查。
- `pnpm build` 生成生产构建。涉及路由、服务端或构建配置的修改需验证构建。

## 代码约定

- 项目使用 React、TypeScript、TanStack Start 和 Tailwind CSS。
- ESLint 配置位于 `eslint.config.mjs`，基于 `@antfu/eslint-config`。
- 使用双引号和分号。导入顺序交给 ESLint 自动整理。
- 使用 `#/` 引用 `src/` 下的模块。
- 路由放在 `src/routes/`，游戏组件放在 `src/components/announcement/` 对应游戏目录中。
- `src/routeTree.gen.ts` 是生成文件，不要手动修改。需要时运行 `pnpm generate-routes`。

## 各游戏独立实现

- 各游戏的页面、卡片和骨架屏分别放在对应游戏目录中。
- 不同游戏不共用业务组件。不要在同一个业务组件中根据游戏切换布局或行为。
- 游戏之间出现重复代码可以接受，不必为消除重复而抽取组件。
- 通用 UI 基础组件和基础样式可以复用。
