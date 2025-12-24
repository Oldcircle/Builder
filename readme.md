## Builder · 命令安全透镜

桌面常驻的命令安全助手：把终端、IDE、AI 面板里“看上去要执行的命令”拉出来，做本地规则评估和可选 LLM 解释，在你按下回车之前给出风险提示与更安全的替代建议。

> 名称：**Builder · 命令安全透镜**（Builder: Command Safety Lens）

---

## 下载

- Windows / macOS：进入 GitHub Releases 下载最新版安装包：`https://github.com/Oldcircle/Builder/releases`
- 文件名大致为：
  - Windows：`Builder Setup *.exe`
  - macOS：`Builder-*.dmg`（或 `Builder-*.zip`）

---

### 特性一览

- 悬浮窗常驻桌面，可收起为小浮球，随时唤出
- 本地规则引擎，对多种 shell 命令做结构化解析与风险打分
- 支持多种输入路径：
  - 剪贴板命令块（Ctrl/Cmd+Shift+V）
  - 屏幕框选 + OCR（Ctrl/Cmd+Shift+S）
  - 活跃应用手动粘贴（Ctrl/Cmd+Shift+A）
- 内置“模型解释”面板，支持多家 LLM 服务商（OpenAI / DeepSeek / Anthropic / Gemini / 自定义 OpenAI 兼容等）
- 可视化风险摘要：风险等级、命令块列表、命中规则一目了然
- 支持本地 HTTP 代理端口配置，方便在受限网络环境下访问模型
- 所有命令解析与规则评估在本地执行，敏感文本不会上传到云端

---

## 目录

- [Builder · 命令安全透镜](#builder--命令安全透镜)
  - [特性一览](#特性一览)
  - [目录](#目录)
  - [快速开始](#快速开始)
  - [使用说明](#使用说明)
    - [主界面与悬浮窗](#主界面与悬浮窗)
    - [三种输入方式](#三种输入方式)
    - [模型解释（LLM）](#模型解释llm)
    - [OCR 识别](#ocr-识别)
  - [模型与代理配置](#模型与代理配置)
  - [架构概览](#架构概览)
  - [开发与调试](#开发与调试)
  - [路线规划](#路线规划)

---

## 快速开始

### 环境要求

- Node.js（建议 ≥ 18）
- npm（或兼容的包管理器）
- 桌面系统：
  - Windows 10/11
  - macOS（当前代码以 Windows 为主，macOS 支持可按需求扩展）

### 安装与运行

```bash
git clone git@github.com:Oldcircle/Builder.git builder
cd builder

npm install
npm start
```

首次启动时，主界面会以悬浮窗形式出现在桌面右上角，支持拖动与收起。

---

## 使用说明

### 主界面与悬浮窗

- 窗口默认置顶显示，方便在终端/IDE 操作时随时查看
- 右上角支持“收起”为一个带 `B` 字母的小浮球，点击 `+` 重新展开
- 界面支持中英文切换：
  - 英文界面：模型解释输出英文
  - 中文界面：模型解释输出简体中文

### 三种输入方式

1. **剪贴板命令块（Ctrl/Cmd+Shift+V）**
   - 在终端、IDE、浏览器中复制一段命令
   - 按 `Ctrl/Cmd+Shift+V` 或点击“分析”
   - Builder 会：
     - 从剪贴板读取文本
     - 解析其中的命令块（多行脚本、`\` 续行、`&&/||/;` 链式命令等）
     - 对每个命令块进行风险评估与规则匹配

2. **OCR 框选识别（Ctrl/Cmd+Shift+S）**
   - 按 `Ctrl/Cmd+Shift+S` 进入屏幕框选模式
   - 拖动选择终端/网页上的命令区域
   - 松开鼠标后，应用会：
     - 截取所选区域的像素
     - 调用本地 Tesseract OCR 识别文本
     - 进行命令净化（去行号、去提示符、拼接折行等）
     - 自动填入输入框并触发分析与模型解释

3. **活跃应用手动粘贴（Ctrl/Cmd+Shift+A）**
   - 在活跃应用中复制“将要执行的命令”
   - 按 `Ctrl/Cmd+Shift+A` 调出 Builder 的“活跃应用抓取”对话框
   - 在弹出的文本框中粘贴并点击“分析”

### 模型解释（LLM）

- 在规则引擎完成本地风险评估后，Builder 会根据当前模型配置调用 LLM：
  - 中文界面：提示模型“用简体中文解释命令、指出风险并给出更安全替代方案”
  - 英文界面：提示模型使用英文简要解释与建议
- 支持的服务商（可在“模型”按钮中配置）：
  - OpenAI（gpt-4o-mini 等）
  - DeepSeek
  - Anthropic（Claude）
  - Google Gemini
  - Azure OpenAI（预留支持位，需要单独适配）
  - 本地 Ollama
  - OpenRouter、Moonshot、智谱 GLM、Perplexity
  - 以及通用的“自定义 / OpenAI 兼容”接口

> 所有模型调用均通过可选的本地代理端口转发；在不配置模型的情况下，规则引擎仍然可以独立工作。

### OCR 识别

- 当前实现基于 `tesseract.js`，默认支持英文识别：
  - 英文界面：使用 `eng` 语言包
  - 中文界面：优先尝试 `chi_sim`（需在本地提供相应语言数据）
- 识别结果会显示置信度（0–1），并在低置信度或空结果时提示用户“请确认后再执行”。

---

## 模型与代理配置

点击主界面右上角的“模型”按钮，可以管理多个模型配置：

- **配置名称**：自定义便于记忆的名字
- **服务商**：OpenAI / DeepSeek / Anthropic / Gemini / 等
- **API 密钥**：
  - 可以直接在界面中填写
  - 也可以留空，使用环境变量：
    - `OPENAI_API_KEY`
    - `DEEPSEEK_API_KEY`
    - `ANTHROPIC_API_KEY`
    - `GEMINI_API_KEY`
    - `OPENROUTER_API_KEY`
    - `MOONSHOT_API_KEY`
    - `ZHIPU_API_KEY`
    - `PERPLEXITY_API_KEY`
    - `AZURE_OPENAI_API_KEY`
- **Base URL**：默认填入对应服务商的官方地址，可按需改为代理或兼容网关地址
- **模型名称**：如 `gpt-4o-mini`、`claude-3-5-sonnet-latest`、`gemini-1.5-flash` 等
- **代理（本地）**：
  - 勾选“通过本地 HTTP 代理转发请求”
  - 填写本地 HTTP/mixed 端口，例如 `7890` 或 `10808`

在网络受限的环境中，建议：

- 使用本地代理工具（Clash / V2Ray / Sing-Box 等）
- 打开 HTTP 或 mixed 监听端口
- 在 Builder 中填写对应端口，即可通过代理访问模型

---

## 架构概览

Builder 按职责拆分为三个主要部分：

- **UI（悬浮窗 / 分析卡片）**
  - Electron 渲染进程
  - 负责展示输入框、概要、命令块、规则命中与模型解释
  - 提供模型配置与代理配置界面

- **Background（托盘 / 快捷键 / 捕获）**
  - Electron 主进程
  - 托盘图标与菜单
  - 全局快捷键注册（剪贴板抓取、OCR 框选、活跃应用抓取）
  - 捕获窗口管理（全屏透明窗口 + 截图）
  - 调用 OCR 引擎并将结果回传 UI

- **Engine（命令解析 + 规则评估 + 证据链）**
  - 纯本地 JavaScript 模块（`src/shared`）
  - 输入命令文本，输出结构化的 `CommandBlock[]`、`Risk`、`Findings`
  - 支持多种 shell（PowerShell / cmd / bash / zsh），处理续行、链式执行、环境变量等

整体目标是：即使在完全离线的环境中，只要不使用 LLM，规则引擎也能独立工作。

---

## 开发与调试

项目使用 Electron 作为跨平台壳，主要目录结构如下：

- `src/main`：主进程代码
  - `main.js`：窗口管理、托盘、快捷键、LLM 调用、OCR 调度
  - `preload.js`：向渲染进程暴露安全的 `builder` API
  - `capturePreload.js`：截屏窗口的预加载脚本
  - `ocr.js`：基于 `tesseract.js` 的 OCR 封装
- `src/renderer`：渲染进程（UI）
  - `index.html / renderer.js / styles.css`：主界面
  - `capture.html / capture.js / capture.css`：框选截屏界面
- `src/shared`：通用逻辑
  - `engine.js`：命令解析与风险评估
  - `rules.js`：规则集合与配置
  - `normalize.js`：命令规范化与辅助工具

### 启动与调试

- 开发模式启动：`npm start`
- 建议在 Electron 窗口中打开 DevTools，观察：
  - 渲染进程控制台（UI 逻辑、桥接状态）
  - 主进程日志（LLM 调用、代理状态、OCR 错误）

---

## 路线规划

当前版本已经实现：

- 剪贴板命令块分析
- OCR 框选识别（基于 Tesseract）
- 活跃应用手动粘贴路径
- 本地规则引擎与多模型解释
- 本地代理端口配置

后续潜在路线：

1. **选中抓取 / 窗口候选抓取**
   - 利用 OS 级可访问性 API（macOS AX / Windows UIA）获取活跃窗口文本
   - 在大文本中自动定位“疑似命令块”，提供候选列表供用户一键确认

2. **IDE / 编辑器插件上报**
   - VS Code / JetBrains 插件监听终端输入、任务运行、AI 建议中的命令块
   - 通过 `localhost` 或命名管道，把“最终将被执行的命令 + 工作目录 + shell + 环境变量”结构化上报给 Builder

3. **更丰富的规则与可视化**
   - 针对云资源操作、数据删除、权限提升等场景，提供更细粒度的规则库
   - 支持“证据链视图”，展示每条规则是如何命中、基于哪些文本片段

欢迎在实际使用中记录你的风险模式需求和集成想法，一起把这块“命令安全透镜”打磨得更好用。  
