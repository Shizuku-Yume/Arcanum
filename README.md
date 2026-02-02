<div align="center">
  <img src="./assets/logo.svg" alt="Arcanum Logo" width="120" height="120" />
  <h1>Arcanum</h1>
  <p>✨  AI 图像生成工作台 | AI Image Generation Workbench</p>

  <p>
    <a href="https://vuejs.org/"><img src="https://img.shields.io/badge/Vue.js-3.0-4FC08D?style=flat-square&logo=vue.js" alt="Vue.js"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript" alt="TypeScript"></a>
    <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-5.0-646CFF?style=flat-square&logo=vite" alt="Vite"></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS"></a>
  </p>
</div>

---

## 📖 项目介绍

**Arcanum** 是一个现代化、高性能的 AI 图像生成 Web 客户端，专为通过 API (如 OpenAI, Google Gemini) 进行图像创作而设计。它不仅是一个简单的 API 调用工具，更是一个完整的创意工作台，提供了提示词管理、历史记录回溯、图生图等高级功能。

项目采用最新的前端技术栈构建，注重用户体验与界面美学，支持深色模式，数据完全存储在本地，保护您的隐私。

## ✨ 核心特性

### 🎨 强大的生成能力
- **多模型支持**：完美支持 OpenAI 格式的绘图接口，特别优化 **Gemini 3 Pro Image** 模型支持。
- **双模态创作**：
  - **文生图 (Text-to-Image)**：通过文字描述挥洒创意。
  - **图生图 (Image-to-Image)**：基于现有图片进行风格迁移或细节重绘。
- **高级参数控制**：支持调整画面比例、图像尺寸、生成数量等。

### 🧩 智能提示词仓库 (Prompt Warehouse)
- **内置灵感库**：集成丰富的预设提示词，涵盖多种风格与主题。
- **分类管理**：支持按分类筛选提示词，快速找到创作灵感。
- **一键复用**：点击即可应用提示词，通过简单的修改即可开始创作。

### 🖼️ 画廊与历史记录
- **本地存储**：使用 IndexedDB (Dexie.js) 本地存储所有生成记录，无需担心页面刷新丢失数据。
- **时间轴视图**：清晰的时间轴展示，方便回溯创作历程。
- **沉浸式查看**：内置 Lightbox 查看器，支持大图预览、下载与参数复用。

### 🛠️ 现代化 UI/UX
- **自适应设计**：完美适配桌面端与移动端操作。
- **深色模式**：自动跟随系统或手动切换，提供舒适的夜间创作体验。
- **流畅交互**：精心设计的动画效果与响应式反馈。

## 🛠️ 技术栈

- **核心框架**: [Vue 3](https://vuejs.org/) (Composition API)
- **构建工具**: [Vite](https://vitejs.dev/)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **图标**: [Lucide Vue](https://lucide.dev/)
- **本地数据库**: [Dexie.js](https://dexie.org/)

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/your-username/arcanum-vue.git
   cd arcanum-vue
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **构建生产版本**
   ```bash
   npm run build
   ```

## ⚙️ 配置说明

在使用前，请点击界面左下角的设置图标进行 API 配置：

1. **API Endpoint**: 输入兼容 OpenAI 格式的 API 地址。
2. **API Key**: 输入您的 API 密钥（密钥仅存储在本地浏览器中，不会上传到任何服务器）。
3. **模型选择**: 手动输入或从列表中选择模型 ID。

## 📄 许可证

本项目基于 MIT 许可证开源。
