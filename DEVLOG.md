# MoodScaper 开发日志 (DevLog)

> 项目：MoodScaper — 每天一张天气氛围壁纸
> 技术栈：Expo SDK 57 · React Native 0.86 · React 19.2.3 · TypeScript 6.0.3
> 仓库：`https://github.com/wdvbnm/moodscaper.git`

---

## 2026-07-06

### 🔧 定位速度优化 & 城市名兜底

**问题**：
- "今日"界面加载慢（最长 20 秒 GPS 超时）
- 城市名显示"未知城市"（天气 API 不返回城市名时无备选）

**修改**：

1. **`src/services/locationService.ts` — 翻转定位优先级**
   - 旧流程：GPS（5s+15s）→ IP（5s）= 最长 ~25s
   - 新流程：**IP 优先**（~2s）→ GPS 只作备选 = 通常 ~2s
   - IP 定位现在也返回 `city` 字段（ipapi.co）

2. **`src/services/weatherService.ts` — 城市名三级兜底**
   - `data.name`（天气 API）→ `location.city`（IP 定位）→ `'未知城市'`

3. **`src/store/AppContext.tsx` — 非阻塞加载**
   - 旧：城市名不对时阻塞 UI 等待刷新
   - 新：**先展示缓存主题**（即时），后台静默刷新城市名
   - 用户打开应用即可看到内容，不再盯着 loading
> 官网：`https://wdvbnm.github.io/moodscaper/` · `https://moodscaper-website.vercel.app`

---

## 2026-07-06

### ⏰ 每日自动换壁纸后台任务

**新增文件：**
- `src/services/backgroundTaskService.ts` — 后台任务定义 + 注册/注销 API

**修改文件：**
| 文件 | 改动 |
|------|------|
| `app.json` | 添加 `expo-background-task` 插件 + `RECEIVE_BOOT_COMPLETED` + `SET_WALLPAPER` 权限 |
| `package.json` | 新增 `expo-background-task` 依赖 |
| `src/types/index.ts` | `UserPreferences` 加 `autoWallpaperEnabled: boolean` |
| `src/store/AppContext.tsx` | 导入 register/unregister，新增 useEffect 根据偏好开关任务 |
| `src/screens/SettingsScreen.tsx` | 新增「每日自动壁纸」Section，Switch 开关 + DEV 测试按钮 |
| `index.ts` | 导入 backgroundTaskService 确保模块级 TaskManager.defineTask 在 React 挂载前执行 |

**技术方案：**
- 使用 `expo-background-task`（替代已废弃的 expo-background-fetch）
- Android 底层 WorkManager，iOS 底层 BGTaskScheduler
- **早间守门模式**：任务每 ~15 分钟触发，仅在 6:00-10:00 AM 且当天未执行时跑完整流水线
- 流水线：定位 → 天气 → 生成主题 → 缓存主题 → Picsum CDN 下载 → `WallpaperSet.setWallpaper()`（仅 Android）
- iOS 只缓存主题到 AsyncStorage（不能自动设壁纸）

**容错设计：**
- 天气 API 失败 → fallback 默认多云天气
- 定位失败 → fallback 上海
- 壁纸下载 → Picsum CDN 不会失败
- `react-native-nitro-wallpaper` 失败 → 非致命，主题仍被缓存
- 所有异常被 catch 返回 `BackgroundTaskResult.Failed`

**边界情况处理：**
- 同一天多次触发 → `LAST_DATE_KEY` 幂等拦截
- 6-10 AM 之外触发 → 立即返回 Success，不消耗资源
- 用户关闭开关 → `unregisterWallpaperTask()` 注销 WorkManager 任务
- 设备重启 → WorkManager 自动恢复（`RECEIVE_BOOT_COMPLETED` 权限）

---

## 2026-07-05

### 🖼️ 一键设壁纸 — Android 全自动 + iOS 引导

**改动文件：**
- `src/screens/HomeScreen.tsx` — 新增「设壁纸」按钮
- `app.json` — 添加 `react-native-nitro-wallpaper` 插件
- `eas.json` — 添加 OTA 更新 channel 配置

**方案选择：**
- 方案一（自定义原生模块）：自己写 `expo-wallpaper` 原生模块，维护成本高
- 方案二（社区包）：`react-native-nitro-wallpaper`，已有人维护
- **最终选方案二**

**实现细节：**
- Android：调用 `WallpaperSet.setWallpaper(url, 'home')`，全自动设置桌面壁纸
- iOS：苹果不开放自动设壁纸 API → 下载图片到本地 → 保存相册 → 弹窗引导用户手动设置
- 新增 `🖼️ 设壁纸` 按钮在底部操作栏

**构建产物：**
- APK: `b7FHI2eCRFyK4GzeryTZhPMmItMgBXGnh_fnNdMtGFM.apk`
- Build ID: `b7f136e2-0914-4d8e-9994-58e1-8f7f-76d5`

---

### 📥 OTA 热更新 (EAS Update)

**改动文件：**
- `app.json` — 添加 `updates` 配置，`runtimeVersion: "1.0.0"`
- `eas.json` — `preview` / `production` profile 添加 `channel`

**配置：**
```json
"updates": {
  "url": "https://u.expo.dev/a50e29e3-ebab-477a-919b-ba8feb04cf1c",
  "enabled": true,
  "fallbackToCacheTimeout": 0
}
```

**作用：** JS 层改动不再需要重新下载 APK，`eas update` 推送即可。

---

### 🐛 修复：Android APK 首次启动闪退

**问题：** 首页 (HomeScreen) 无法加载，商店 (ShopScreen) 闪退。

**根因定位：**
- 初始误判为 Hermes 不支持动态 `require()`（实际上 Hermes 支持）
- **真正原因：** React Native 中使用了 Web-only API：
  - `<img>` HTML 标签 → 应使用 `<Image>` 组件
  - `document.createElement('canvas')` → 仅 Web 可用
  - `FileReader` → 仅 Web 可用
  - Canvas 下载 → 需用 `expo-file-system` + `expo-media-library`

**修复文件：**
| 文件 | 改动 |
|------|------|
| `src/screens/HomeScreen.tsx` | 移除 `document.createElement('canvas')`、`FileReader`，用 `Platform.OS` 分支 |
| `src/screens/ShopScreen.tsx` | `<img>` → `<Image>`，Canvas 下载 → expo-file-system + expo-media-library |
| `src/services/locationService.ts` | 动态 `require('expo-location')` 仅在 native 路径 |
| `src/services/weatherService.ts` | 添加 AbortController 8s 超时 |
| `src/services/wallpaperGenerator.ts` | 添加 Unsplash fetch 超时 |
| `src/services/colorExtractor.ts` | `Platform.OS !== 'web'` 时直接 return null |
| `src/services/shareCardService.ts` | `Platform.OS !== 'web'` 时 return '' |
| `src/services/wallpaperService.ts` | expo-media-library / expo-sharing 改为动态 require |
| `src/services/photoStorage.ts` | expo-image-picker 改为动态 require |

**关键模式：** 所有原生模块导入用动态 `require()` 包裹在 `Platform.OS` 条件里，确保它们不进 web bundle。

---

### 🐛 修复：Web 端白屏

**问题：** Web 构建后打开白屏，无任何内容。

**根因：** 之前为了修 native 闪退，把一些原生模块改成了静态 import，导致 `expo-file-system`、`expo-media-library`、`expo-sharing`、`expo-image-picker` 被打包进了 web bundle（311→199 模块），运行时报错。

**修复：** 恢复动态 `require()` 模式 — 原生模块只在 `if (Platform.OS !== 'web')` 分支里 require，webpack 不会打包它们。

---

### ⚡ 性能：壁纸加载优化

**问题：** 壁纸图片加载极慢/加载不出来。

**根因：**
- Unsplash API 在国内访问受限
- 预览图和下载图同一尺寸 1290×2796，太大

**方案讨论（与用户）：**
- 方案一（用户手机本地存储 App 专属图片库）：用户觉得不合理，谁会提前存图
- **方案二（CDN 小尺寸预览 + 后台大图）：** ✅ 选中
- 用户明确拒绝渐变色方案：「不能改成渐变色，因为今日界面是有保存和分享按键的并且这是这个app主打的」

**实施：**

| 文件 | 改动 |
|------|------|
| `src/services/wallpaperGenerator.ts` | 签名改为 `{ primary, enhanced, downloadUrl }`；primary = Picsum 360×780（秒开），enhanced = Unsplash（后台替换），downloadUrl = 1290×2796 |
| `src/services/shopService.ts` | `ShopWallpaper` 三种尺寸：thumbUrl 400×600，detailUrl 360×780，downloadUrl 1290×2796 |
| `src/screens/HomeScreen.tsx` | 立即渲染 Picsum primary，enhanced 到后静默替换 |

**常量：** `PREVIEW_W = 360, PREVIEW_H = 780`

---

### 🎨 UI：发现页类目栏改为网格布局

**问题：** 横向 ScrollView 的类目栏在手机上太窄，后面的类目看不到。

**修复：** 将 `ShopScreen.tsx` 中的类目栏从水平 ScrollView 改为 2 列 FlatList 网格，每个类目都能看到。

---

### 🐛 修复：网络请求超时导致首页卡死

**问题：** 定位和天气 API 在中国网络环境下无响应，首页无限 loading。

**修复：**
- `locationService.ts`: `Promise.race` + 8s 超时，失败回退默认上海位置
- `weatherService.ts`: `AbortController` + 8s 超时，失败回退默认天气数据
- `wallpaperGenerator.ts`: Unsplash fetch 加超时
- `shopService.ts`: Unsplash API 10s 超时

---

## 2026-07-04

### 🐛 修复：Node.js v24 类型剥离错误

**问题：** `expo config --json` 失败：
```
Stripping types is currently unsupported for files under node_modules
```

**根因：** Node.js v24 默认开启 `--experimental-strip-types`，与 `expo-modules-core` 冲突。

**尝试过的方案：**
1. Shell 临时 `NODE_OPTIONS` — 子进程不继承，无效
2. `bash -c` 包裹 — 无效
3. `fnm` 切换 Node 版本 — 本项目未用 fnm

**最终修复：** `setx NODE_OPTIONS "--no-experimental-strip-types"`（Windows 全局环境变量），重启终端后生效。

---

### 🐛 修复：expo-image-picker 缺失导致构建失败

**问题：** Bundle JavaScript 阶段报错，`expo-image-picker` 被静态 import 但未安装。

**修复：** `npx expo install expo-image-picker`

---

### 🌐 官网部署

**仓库：** `https://github.com/wdvbnm/moodscaper.git`（当时为空仓库）

**网站文件：**
- `moodscaper-website/index.html` — 产品主页
- `moodscaper-website/privacy.html` — 隐私政策
- `moodscaper-website/terms.html` — 服务条款

**部署平台：**
| 平台 | URL | 方式 |
|------|-----|------|
| GitHub Pages | `https://wdvbnm.github.io/moodscaper/` | 从 GitHub 自动部署 |
| Vercel | `https://moodscaper-website.vercel.app` | 从 GitHub 自动部署 |

**首页功能：**
- Hero 区域：展示 App 概念（两个 mockup 手机预览）
- 功能介绍：4 个卡片（天气氛围主题、高清壁纸库、AI 独家生成、上传你的壁纸）
- 使用步骤：1-2-3（偏好 → 天气 → 解锁）
- 下载 CTA：Android 直接链接 APK，iOS placeholder
- 二维码：QR Server API 动态生成
- Footer：隐私政策 + 服务条款 + 联系方式

---

### 🔧 环境配置

**全局环境变量：**
- `NODE_OPTIONS = "--no-experimental-strip-types"`（解决 Node v24 兼容性）

**Expo 项目 ID：** `a50e29e3-ebab-477a-919b-ba8feb04cf1c`

**EAS Build Profile：**
- `preview` — 内部测试，channel: preview
- `production` — 正式发布，channel: production

---

## 架构决策记录 (ADR)

### ADR-001: 原生模块导入模式
**决定：** 所有仅原生可用的模块使用动态 `require()` + `Platform.OS` 条件包裹。
**原因：** 静态 import 会把原生模块打进 web bundle 导致白屏；动态 require 在 webpack 中会被 tree-shake 掉。
**适用文件：** expo-file-system, expo-media-library, expo-sharing, expo-image-picker, expo-location, react-native-nitro-wallpaper

### ADR-002: 壁纸图片来源
**决定：** Picsum 为主（CDN 快），Unsplash 为辅（后台增强）。
**原因：** Unsplash 在国内不稳定；Picsum 全球 CDN，360×780 小图秒开。

### ADR-003: 壁纸设置方案
**决定：** Android 用 `react-native-nitro-wallpaper` 社区包（全自动），iOS 用保存相册 + 引导（半自动）。
**原因：** iOS 无公开 API 支持自动设壁纸；社区包比自写原生模块更稳定易维护。

### ADR-004: 网络容错
**决定：** 所有外部 API 调用必须有超时（8-10s）且有降级默认值。
**原因：** 中国网络环境对 Unsplash、OpenWeatherMap 等境外服务不稳定。

---

## 已知待办

- [ ] **每天自动换壁纸后台任务** — `expo-task-manager` 已安装，`react-native-nitro-wallpaper` 已就绪，需实现后台定时 fetch 天气 → 生成壁纸 → 调用 setWallpaper
- [ ] iOS 设壁纸引导可优化（目前只是弹窗文字，可加示意图）
- [ ] AI 生成壁纸功能（Pro 功能，目前按钮已放置但后端未接）
- [ ] 更多响应式优化（平板适配）

---

## 发布历史

| 日期 | 版本 | 平台 | APK / 更新方式 | 说明 |
|------|------|------|---------------|------|
| 2026-07-05 | 1.0.0 | Android | `b7FHI2eC...GFM.apk` | 设壁纸 + 性能优化 + OTA |
| 2026-07-04 | 1.0.0 | Android | 前一版 APK | 修复闪退 + 网络超时 |

---

> 格式说明：每条记录包含日期、改动标题、涉及文件、问题/背景、解决方案。commit 与此 devlog 条目一一对应。
