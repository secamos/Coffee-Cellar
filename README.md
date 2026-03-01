 HEAD
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

# Coffee-Cellar

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**English** | [中文](#中文介绍)

A personal coffee bean management system for enthusiasts. Track your inventory, monitor aging status, and get daily brewing recommendations based on freshness and variety.

Beyond inventory management, Coffee-Cellar provides professional cupping logs and consumption analytics to help you understand your flavor preferences over time.

## ✨ Features

- 📦 **Inventory Management** - Track stock levels, purchase prices, and roast dates
- ⏱️ **Aging Tracker** - Monitor resting status and optimal brewing windows  
- 🎯 **Smart Recommendations** - Daily suggestions based on bean maturity and variety diversity
- 📝 **Cupping Log** - Professional tasting notes and flavor profiling
- 📊 **Data Analytics** - Consumption patterns and cost tracking

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/Coffee-Cellar.git

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📸 Screenshots

*Coming soon...*


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 中文介绍

**Coffee Cellar** 是一个面向咖啡爱好者的个人咖啡豆管理系统。

### 核心功能

- **库存管理**：追踪熟豆库存、入库价格、剩余克重
- **养豆追踪**：按照烘焙商自动计算养豆期，提示最佳饮用窗口
- **智能推荐**：基于养豆状态与品种多样性，每日推荐饮用顺序
- **杯测记录**：专业风味轮与评分档案
- **数据分析**：库存消耗、月均成本、价格趋势可视化

### 为什么选择 Coffee-Cellar？

解决咖啡爱好者的三大痛点：
1. "这包豆子养好了吗？"
2. "今天喝哪支？"
3. "我的咖啡花了多少钱？"

Built with ❤️ and [Cursor]
 101d05ae2d2fa0b8032c2057692235703f665dd5
