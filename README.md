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
pnpm build
pnpm preview
```

## Server OCR

列表 API 只从正文提取时间。崩坏三路由 loader 在时间缺失时发起 OCR，并返回结果 Promise；页面通过 Suspense 和 Await 显示时间骨架屏及识别结果。SSR 和浏览器导航均请求独立接口 `/api/announcement/bh3/ocr?ann_id=20004593,20004594`，使用 Tesseract.js 识别“补给信息”下图片的左侧 35%。单次最多 8 个公告 ID，去重、排序后重定向到规范 URL。中文模型随 `@tesseract.js-data/chi_sim` 安装，运行时不下载模型、不写入磁盘缓存，也不调用付费 OCR 服务。年份结合公告列表时间确定，缺失时使用图片上传日期；“版本更新后”保留为文字。

OCR 完整结果通过 `CDN-Cache-Control` 设置 CDN 缓存 24 小时；错误及未识别完整的响应为 `no-store`。CDN 缓存键需包含 `ann_id` 查询参数，并启用 API JSON 响应缓存。响应只包含固定时间与“版本更新后”等描述，相对时间在浏览器计算。服务端无内存结果缓存；同一请求中的公告依次识别，任务结束释放 worker。下载和识别有超时、图片大小限制，需要支持 Node.js worker threads 的运行环境。

`[announcement-ocr]` 日志记录任务 ID、图片 URL、下载、worker 初始化、识别和总耗时，以及置信度、超时和失败原因。`[announcement-ocr-api]` 记录公告 ID、上游和接口总耗时、结果是否完整；`[bh3-announcement] loaded` 记录列表加载耗时。CDN 命中时不执行源站 OCR。

SSR 构建将 Tesseract.js 保留为外部依赖，并通过 `require.resolve` 定位 worker 和中文模型。部署时需保留生产依赖 `node_modules`，其中包含 worker 脚本、WASM 和模型，单独复制 `dist` 不足以运行 OCR。
