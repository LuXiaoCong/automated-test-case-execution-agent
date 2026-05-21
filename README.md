# AI 自动化测试平台

一个基于 React + TypeScript + Vite 构建的 AI 驱动自动化测试管理平台，集成大语言模型实现智能需求分析和测试用例生成。

## 功能特性

### 📋 需求管理
- 创建、查看、管理测试需求
- 支持上传 PDF、Word、TXT 文档
- AI 智能分析需求，自动生成标题和代码建议
- 文档条目化存储，自动同步到知识库

### 📝 测试用例
- 管理测试用例库
- 支持 DeepSeek 根据业务文档自动生成测试用例
- 预览生成结果，支持批量保存
- 查看用例详情，包含测试步骤和预期结果

### ▶️ 测试执行
- 执行测试计划
- 支持测试用例选择和批量执行

### 📊 测试结果
- 查看测试报告和结果统计
- 可视化展示测试执行状态

### 🤖 模型库
- 支持配置多种大语言模型（OpenAI、Anthropic、通义千问、自定义）
- 管理 API Key 和模型参数
- 支持启用/禁用模型

### 📚 知识库
- 分类管理知识条目
- 支持文件上传自动切片
- 配置向量模型用于语义检索
- 标签系统便于分类和搜索

### 🌐 局域网访问
- 支持同一网络内的用户访问
- 一键启动，开箱即用

## 快速开始

### 方法1：使用启动脚本（推荐）

直接双击 `start.bat` 即可启动！

### 方法2：手动启动

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install

# 返回项目根目录
cd ..

# 启动开发服务器（支持局域网访问）
npm run dev
```

启动后，在浏览器中访问显示的地址（通常是 http://localhost:5173/）。

### 启动后端服务（如需 AI 功能）

```bash
cd server
npm run dev
```

后端服务默认运行在 `http://localhost:3001`。

## 局域网访问

已配置支持局域网访问！

启动服务器后，查看控制台输出：

```
  Local:   http://localhost:5173/     ← 本机访问
  Network: http://192.168.x.x:5173/   ← 局域网其他人访问
```

将 `Network` 地址分享给同一局域网内的其他用户即可访问。

### 查看本机 IP

如果需要查看本机 IP：
- 方法1：看服务器启动窗口的 Network 地址
- 方法2：打开 cmd，输入 `ipconfig`，查找 IPv4 地址

## 项目结构

```
AI训练营/
├── src/                     # 前端源码
│   ├── pages/              # 页面组件
│   │   ├── Home.tsx        # 首页仪表盘
│   │   ├── Requirements.tsx # 需求管理
│   │   ├── TestCases.tsx   # 测试用例管理
│   │   ├── TestExecution.tsx # 测试执行
│   │   ├── TestResults.tsx  # 测试结果
│   │   ├── ModelLibrary.tsx # 模型库管理
│   │   └── KnowledgeBase.tsx # 知识库管理
│   ├── components/         # 公共组件
│   │   ├── Header.tsx      # 页头组件
│   │   ├── Sidebar.tsx     # 侧边栏导航
│   │   └── Empty.tsx       # 空状态组件
│   ├── store/              # 状态管理 (Zustand)
│   │   ├── index.ts        # 模型库状态
│   │   ├── appStore.ts     # 应用状态（需求、用例、执行）
│   │   └── knowledgeStore.ts # 知识库状态
│   ├── services/           # API 服务
│   │   └── aiService.ts    # AI 服务接口
│   ├── types/              # TypeScript 类型定义
│   │   ├── model.ts        # 模型类型
│   │   └── requirement.ts  # 需求类型
│   ├── lib/                # 工具函数
│   │   ├── documentSegment.ts # 文档切片处理
│   │   └── utils.ts        # 通用工具
│   ├── data/               # 初始化数据
│   │   └── knowledgeData.ts # 知识库初始数据
│   ├── hooks/              # 自定义 Hooks
│   │   └── useTheme.ts     # 主题 Hook
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # 入口文件
│   └── index.css           # 全局样式
├── server/                 # 后端服务
│   ├── api/               # API 路由
│   │   ├── ai.ts          # AI 相关接口
│   │   └── ai.js          # 编译后的 JS 文件
│   ├── .env               # 环境变量配置
│   ├── .env.example       # 环境变量示例
│   ├── index.ts           # 服务入口
│   └── package.json       # 后端依赖
├── public/                 # 静态资源
├── dist/                   # 构建产物
├── index.html              # HTML 模板
├── package.json            # 前端依赖
├── vite.config.ts          # Vite 配置
├── tailwind.config.js      # Tailwind CSS 配置
├── postcss.config.js       # PostCSS 配置
├── tsconfig.json           # TypeScript 配置
├── eslint.config.js        # ESLint 配置
└── start.bat               # 快速启动脚本
```

## 技术栈

| 分类 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React | 18.x |
| 语言 | TypeScript | 5.x |
| 构建工具 | Vite | 6.x |
| 状态管理 | Zustand | 5.x |
| 样式框架 | Tailwind CSS | 3.x |
| 图标库 | Lucide React | 0.511.x |
| 路由 | React Router | 7.x |
| 后端框架 | Express | 4.x |
| 文件解析 | pdf-parse / mammoth | - |

## 可用命令

```bash
npm run dev      # 启动前端开发服务器（支持局域网访问）
npm run build    # 构建生产版本
npm run lint     # ESLint 代码检查
npm run check    # TypeScript 类型检查
npm run preview  # 预览生产构建

cd server && npm run dev  # 启动后端服务
```

## 配置说明

### 环境变量

在 `server/.env` 文件中配置：

```env
# 服务端口
PORT=3001

# DeepSeek API Key（可选，也可在前端模型库配置）
DEEPSEEK_API_KEY=your-api-key-here

# CORS 配置
CORS_ORIGIN=http://localhost:5173
```

### 使用 DeepSeek 生成测试用例

1. 启动项目（`start.bat` 会同时启动前端与后端 API）
2. 在「模型库」中为 **DeepSeek Chat** 配置 API Key（或在 `server/.env` 设置 `DEEPSEEK_API_KEY`）
3. 在「需求管理」上传业务文档并点击 **AI 智能分析**
4. 在「用例管理」点击 **AI 生成用例**，或于需求详情中点击 **DeepSeek 生成测试用例**

## 常见问题

### Q: 网页一直在加载？
A: 查看服务器窗口显示的端口号，手动在浏览器输入正确的地址。

### Q: 局域网其他人访问不了？
A: 检查：
1. 是否在同一 WiFi/局域网
2. Windows 防火墙是否阻止了连接（可临时关闭测试）
3. IP 地址和端口是否正确

### Q: 端口被占用？
A: Vite 会自动尝试下一个可用端口，查看服务器窗口的实际端口号。

### Q: AI 分析/生成用例失败？
A: 请确认：
1. 后端服务已启动（运行 `cd server && npm run dev`）
2. 已在模型库配置并启用了 DeepSeek 模型
3. API Key 正确且有效

## 许可证

MIT License

## 开发说明

### 添加新页面

1. 在 `src/pages/` 目录下创建新组件
2. 在 `src/App.tsx` 中添加路由配置
3. 在 `src/components/Sidebar.tsx` 中添加导航菜单项

### 添加新功能

1. 根据需求在 `src/store/` 中添加状态管理
2. 在 `src/types/` 中定义相关类型
3. 创建页面组件实现 UI
4. 如需后端支持，在 `server/api/` 中添加接口

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用 Tailwind CSS 进行样式开发
- 组件命名使用 PascalCase
- 文件命名使用 kebab-case