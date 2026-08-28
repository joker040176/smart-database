# 智能表格数据库 - Cloudflare Pages 部署

## 项目结构
```
cloudflare-deploy/
├── index.html              # 前端应用
├── wrangler.toml           # Cloudflare配置
├── functions/
│   └── api/
│       └── [[path]].js    # 飞书API代理函数
└── README.md               # 本文件
```

## 部署方法一：通过GitHub自动部署（推荐）

1. 在GitHub创建一个新仓库
2. 把本目录所有文件推送到GitHub仓库
3. 登录 https://dash.cloudflare.com/
4. 进入「Workers & Pages」→「Create application」→「Pages」→「Connect to Git」
5. 选择你刚创建的GitHub仓库
6. 构建设置：
   - Framework preset: None
   - Build command: 留空
   - Build output directory: .
7. 点击「Save and Deploy」
8. 等待部署完成，会得到一个网址，如 `https://smart-database.pages.dev`

## 部署方法二：通过Wrangler CLI直接上传

1. 安装Node.js
2. 安装Wrangler: `npm install -g wrangler`
3. 登录: `wrangler login`
4. 在本目录执行: `npx wrangler pages deploy . --project-name=smart-database`
5. 等待部署完成

## 手机端使用

1. iPhone用Safari打开部署后的网址
2. 点击底部「分享」按钮
3. 选择「添加到主屏幕」
4. 桌面会出现一个图标，点开就是全屏应用

## 数据同步

- 电脑端EXE和手机端网页版读写的是同一个飞书多维表格
- 数据实时同步，两边操作互不冲突

## 注意事项

- 飞书API密钥已硬编码在functions/api/[[path]].js中
- 如果需要更换飞书应用，修改该文件中的FEISHU_APP_ID和FEISHU_APP_SECRET
- Cloudflare Pages免费版每天有10万次请求额度，个人使用完全足够
