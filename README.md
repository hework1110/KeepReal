# KeepReal

KeepReal 是一款离线健身记录 App，面向想自己安排训练计划的人，支持增肌和减脂两种目标。

## 当前状态

- 正式研发阶段：`app/` 为 Uni-App（Vue 3 + Vite）工程，已搭好五 Tab 骨架、深色主题变量与本地存储层。
- `2026-11-19/fitness-app-prototype/` 是高保真原型，作为视觉与交互参照，不再改动。
- 无后端、无账号体系，所有数据保存在本机。

## 如何打开原型

直接双击 `2026-11-19/fitness-app-prototype/outputs/index.html` 即可在浏览器中运行，无需安装依赖或启动服务。

桌面端会居中显示手机尺寸的画布，方便预览移动端效果。

## 启动 App 工程（H5）

需要 Node.js 18 及以上。

```bash
cd app
npm install
npm run dev:h5
```

终端会输出本地地址（默认 `http://localhost:5173`），浏览器打开即可看到底部五个 Tab：今天、计划、进步、身体、我的。

常用命令（均在 `app/` 下执行）：

- `npm run dev:h5`：H5 开发预览
- `npm run build:h5`：构建 H5 产物，输出到 `app/dist/build/h5`
- `npm run build:app`：构建 App 资源，输出到 `app/dist/build/app`

## 打包 Android APK

命令行只负责编译 App 资源，生成 APK 需要借助 HBuilderX：

1. 用 HBuilderX 打开 `app/` 目录。
2. 在 `src/manifest.json` 的基础配置中获取并填写 DCloud `appid`（云打包必需）。
3. 菜单「发行 → 原生 App-云打包」，勾选 Android 并选择证书，打包完成后下载 APK。
4. 如需离线打包，改用 DCloud Android 离线 SDK + Android Studio，按官方文档配置。

## 目录结构

```
app/                          # Uni-App（Vue 3 + Vite）正式工程
├── src/
│   ├── pages/                # 五个 Tab 页面（今天、计划、进步、身体、我的）
│   ├── store/storage.js      # 本地存储层（版本号 + 计划/训练记录/身体数据空壳）
│   ├── styles/tokens.css     # 深色主题变量与基础样式
│   ├── App.vue
│   ├── main.js
│   ├── pages.json            # 页面与 tabBar 配置
│   └── manifest.json         # 应用打包配置
├── index.html
├── vite.config.js
└── package.json

2026-11-19/fitness-app-prototype/
├── src/        # 原型源码（分模块的 HTML 骨架、CSS、JS 与 SVG sprite）
├── scripts/    # 构建脚本，把 src/ 拼装成自包含单文件
├── outputs/    # 可运行成品（index.html，双击即可离线运行）
└── work/       # 构建与验证的中间产物（截图、本地验证脚本），已被 .gitignore 排除
```

原型修改 `src/` 后执行 `node scripts/build.js`，即可重新生成 `outputs/index.html`。

## 后续计划

1. 把原型的数据模型与页面逻辑迁移到 `app/`。
2. 依次完成计划、训练执行、进步、身体等业务模块。
