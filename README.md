# 企业官网 + 后台管理（Espache）

## 功能
- 企业官网：首页展示公司介绍、服务能力、新闻中心与商务咨询表单。
- 后台管理：支持 token 登录、编辑站点信息、发布/删除新闻、查看咨询消息。
- 数据持久化：所有内容保存于 `data/content.json`。

## 快速启动
```bash
npm start
```

访问：
- 官网：`http://localhost:3000`
- 后台：`http://localhost:3000/admin`

默认后台 token：`espache-admin-2026`（可通过环境变量 `ADMIN_TOKEN` 覆盖）

## 校验
```bash
npm run check
```
