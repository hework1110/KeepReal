# KeepReal

KeepReal 是一款离线健身记录 App，面向想自己安排训练计划的人，支持增肌和减脂两种目标。

## 当前状态

- 原型阶段，纯静态页面（HTML / CSS / JS）。
- 无后端、无账号体系。
- 所有数据保存在浏览器本地。

## 如何打开

直接双击 `2026-11-19/fitness-app-prototype/outputs/index.html` 即可在浏览器中运行，无需安装依赖或启动服务。

桌面端会居中显示手机尺寸的画布，方便预览移动端效果。

## 目录结构

```
2026-11-19/fitness-app-prototype/
├── src/        # 源码（分模块的 HTML 骨架、CSS、JS 与 SVG sprite）
├── scripts/    # 构建脚本，把 src/ 拼装成自包含单文件
├── outputs/    # 可运行成品（index.html，双击即可离线运行）
└── work/       # 构建与验证的中间产物（截图、本地验证脚本），已被 .gitignore 排除
```

修改 `src/` 后执行 `node scripts/build.js`，即可重新生成 `outputs/index.html`。

## 后续计划

1. 先把原型补完整。
2. 再迁移到 Uni-App，做跨平台版本。
