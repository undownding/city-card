# City Card - 智能城市天气卡片生成器

City Card 是一个基于 Next.js 16 和 Cloudflare 构建的智能城市天气卡片生成应用。它能够根据用户的地理位置自动获取城市信息，并使用 AI 生成精美的天气卡片图像。

## 项目特性

- 📍 **自动定位**：使用浏览器地理定位获取当前位置
- 🌍 **反向地理编码**：通过坐标获取城市名称（基于 OpenStreetMap Nominatim）
- 🤖 **AI 图像生成**：使用 Google AI Studio (Gemini 3.1 Flash) 生成高质量天气卡片
- 📦 **云存储**：天气卡片图像存储在 Cloudflare R2 对象存储中
- 🎨 **精美的设计**：使用 Tailwind CSS 实现现代、响应式的用户界面
- 🔄 **缓存机制**：已生成的天气卡片会被缓存，提高加载速度
- 🚀 **部署在 Cloudflare**：使用 OpenNext 部署到 Cloudflare Pages

## 技术栈

- **框架**：Next.js 16.1.6
- **语言**：TypeScript
- **UI 框架**：Tailwind CSS 3.4.0
- **AI**：Google Generative AI (Gemini 3.1 Flash)
- **部署**：Cloudflare Pages + OpenNext
- **存储**：Cloudflare R2 对象存储
- **地图**：OpenStreetMap Nominatim API

## 安装

### 前置要求

- Node.js >= 18.0.0
- npm 或 yarn
- Cloudflare 账户（用于部署）

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建 `.dev.vars` 文件（本地开发）和 Cloudflare Pages 环境变量：

```bash
# Cloudflare AI Gateway
AI_GATEWAY = "your-ai-gateway"

# Cloudflare R2 存储桶
WEATHER_CARDS_R2_BUCKET = "your-r2-bucket-name"

# Google AI Studio API（可选，如使用直接 API 访问）
GOOGLE_API_KEY = "your-google-api-key"
```

### 本地开发

```bash
npm run dev
```

访问 `http://localhost:3000` 查看应用。

### 生产构建

```bash
npm run build
```

## 部署

### 部署到 Cloudflare Pages

```bash
# 预览部署
npm run preview

# 正式部署
npm run deploy
```

或通过 Cloudflare Pages 控制台手动部署。

## 使用方法

1. 打开应用后，浏览器会请求地理位置权限
2. 允许权限后，应用会自动获取您的位置
3. 通过坐标查询城市名称
4. 调用 AI 生成天气卡片图像
5. 显示生成的天气卡片

### 刷新天气卡片

如果需要刷新天气卡片，可以点击"重试"按钮或刷新页面。

## API 文档

### 获取天气卡片

**接口**：`GET /api/image?city=<城市名称>`

**参数**：
- `city`：城市名称（必填）

**响应**：
```json
{
  "imageUrl": "https://card-r2.undownding.dev/2024-02/27/beijing.webp"
}
```

**示例**：
```bash
curl "http://localhost:3000/api/image?city=北京"
```

### 反向地理编码

**接口**：`GET /api/reverse-geocode?lat=<纬度>&lon=<经度>`

**参数**：
- `lat`：纬度（必填）
- `lon`：经度（必填）

**响应**：
```json
{
  "address": {
    "city": "北京",
    "town": null,
    "village": null
  }
}
```

**示例**：
```bash
curl "http://localhost:3000/api/reverse-geocode?lat=39.9042&lon=116.4074"
```

## 项目结构

```
├── app/
│   ├── api/
│   │   ├── image/
│   │   │   └── route.ts      # 生成天气卡片 API
│   │   └── reverse-geocode/
│   │       └── route.ts      # 反向地理编码 API
│   ├── layout.tsx            # 根布局
│   ├── page.tsx              # 主页面
│   └── globals.css           # 全局样式
├── public/                   # 静态资源
├── .dev.vars                 # 本地开发环境变量
├── next.config.ts            # Next.js 配置
├── open-next.config.ts       # OpenNext 配置
├── tailwind.config.ts        # Tailwind CSS 配置
├── wrangler.jsonc           # Cloudflare Wrangler 配置
└── package.json              # 项目依赖
```

## 开发指南

### 添加新功能

1. 创建或修改 `app/page.tsx` 实现 UI
2. 在 `app/api/` 目录下创建新的 API 路由
3. 在 `wrangler.jsonc` 中配置 Cloudflare 资源绑定
4. 在 `.dev.vars` 中添加开发环境变量

### 测试

```bash
# 运行 ESLint
npm run lint
```

### 构建优化

- 使用 `npm run build` 生成生产版本
- 构建产物会自动优化以提高性能

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过以下方式联系：

- 邮箱：support@city-card.local
- GitHub：[github.com/undownding/city-card](https://github.com/undownding/city-card)

## 更新日志

### v0.1.0 (2026-02-27)

- 初始版本发布
- 支持自动定位和城市识别
- 集成 Google AI Studio 图像生成
- 使用 Cloudflare R2 存储天气卡片
