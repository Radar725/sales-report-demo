# CRM 业绩与转化漏斗报表 Demo

咨询部 CRM 业绩报表与转化漏斗报表的交互原型，使用 Mock 数据，用于产品评审与开发对齐。

## 在线访问

部署后在此填写 Demo 地址，例如：`https://sales-report-demo.vercel.app`

## 功能说明文档

产品需求文档：[docs/CRM业绩与转化漏斗报表PRD_功能说明.md](./docs/CRM业绩与转化漏斗报表PRD_功能说明.md)

## 本地开发

```bash
npm install
npm run dev
```

浏览器打开终端提示的本地地址（默认 `http://localhost:5173`）。

## 构建与测试

```bash
npm run build    # 生产构建，输出到 dist/
npm run preview  # 本地预览构建结果
npm test         # 运行单元测试
```

## 部署到 Vercel（免费）

1. 将本仓库推送到 GitHub（公开仓库即可）
2. 登录 [Vercel](https://vercel.com)，用 GitHub 账号授权
3. **Add New → Project**，选择本仓库
4. 保持默认构建设置：
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 点击 **Deploy**，完成后获得 `https://xxx.vercel.app` 公网链接

之后每次 `git push` 到 main 分支，Vercel 会自动重新部署。

### 不用 GitHub 的快速部署

```bash
npm i -g vercel
vercel
```

按提示登录并确认项目设置即可。

## 技术栈

- React 18 + TypeScript
- Vite 7
- Ant Design 5
