# MoodScaper 官网开发日志 (DevLog)

> 官网 URL：`https://wdvbnm.github.io/moodscaper/` · `https://moodscaper-website.vercel.app`
> 仓库：`https://github.com/wdvbnm/moodscaper.git`
> 部署：GitHub Pages (主) + Vercel (备)，均从 GitHub push 自动部署

---

## 2026-07-05

### 🔗 更新下载链接
- APK 更新为 `b7FHI2eCRFyK4GzeryTZhPMmItMgBXGnh_fnNdMtGFM.apk`
- 新版 APK 支持一键设壁纸 + OTA 热更新

---

## 2026-07-04

### 🚀 首次部署
- 从空 GitHub 仓库开始，创建 `index.html`、`privacy.html`、`terms.html`
- 配置 GitHub Pages：Settings → Pages → Deploy from main branch
- 配置 Vercel：导入 GitHub 仓库，自动检测静态站点
- 两个平台均设置自动部署（git push 即更新）

### 📄 首页内容
- Hero：App 名称 + 标语 + 两个 mockup 手机预览（亮色/暗色天气）
- 核心功能：4 卡片（天气氛围主题、高清壁纸库、AI 独家生成、上传壁纸）
- 使用步骤：3 步（偏好 → 天气 → 解锁）
- CTA：Android APK 下载 + iOS App Store placeholder
- QR 码：API 动态生成指向当前页面
- Footer：隐私政策 + 服务条款 + 联系邮箱

### 🎨 设计
- 配色：`#F5F0E8` 暖白底 + `#5C4F3C` 深棕文字
- 字体：PingFang SC / Microsoft YaHei 优先
- 最大宽度 480px（移动优先），768px+ 断点

---

## 发布历史

| 日期 | 变更 |
|------|------|
| 2026-07-05 | 更新 APK 下载链接（设壁纸版） |
| 2026-07-04 | 首次部署官网 |
