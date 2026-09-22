# 知序 · Talent Atlas

年度人才盘点工作台。Next.js / React / TypeScript，dnd-kit 拖拽，ExcelJS 和 PapaParse 导入，PostgreSQL 可选持久化。

## 本地运行

```sh
npm install
npm run dev
```

打开 http://127.0.0.1:3000 。默认载入120名虚拟员工，AI为Mock模式。首次变更后保存到 `data/store.json`，重启保留数据。文件模式仅适用于单进程本地演示。

## Netlify 演示部署

可以部署到 Netlify 做内部演示。当前项目使用 Next.js App Router，`netlify.toml` 已配置 `npm run build`，Netlify 会将页面和 API 路由转换为托管资源。演示版使用 `outputs/mock-2025` 中的虚拟数据，数据会随站点资源发布，访问者可以通过浏览器查看它；不要把真实员工数据放进前端演示版。未配置 `DATABASE_URL` 和 `APP_ACCESS_TOKEN` 时适合演示；正式环境需启用数据库、身份鉴权和服务端数据。

发布前：

```sh
npx netlify status
npx netlify init
npx netlify deploy --prod
```

若 CLI 提示未登录，先运行 `npx netlify login`。本地只需将 Netlify CLI 登录到目标团队，然后从项目目录执行部署。

```sh
npm test
npm run typecheck
npm run build
npm start
```

## 当前功能

- 组织、小组、姓名/工号/岗位、职级、在职状态筛选；筛选不改变全组织排名。
- 二级组织独立绩效/能力双轴强制分布；自定义评分维度、权重、高中低比例和九格建议比例。
- 拖拽或画像中调整格子，要求原因与确认，服务端版本检查及原子保存；保留初始评分及历史记录。
- 人才画像、关键岗位接任梯队、组织分布、CSV盘点导出、浏览器打印/另存PDF画像。
- Excel/CSV全量导入，预校验、预览与替换确认；未知字段保留，`_score`后缀字段进入评价维度选项。
- 年度批次建立、上一年度只读归档。新年度为空，需导入对应年度数据。
- Mock分析引用当前数据生成明确标注的模板结果。API模式保留服务地址、模型、指令配置，**尚未启用真实模型调用**，不收集密钥，不静默回退Mock。
- `GET /api/employees` 与 `POST /api/employees` 数据接口；MCP入口仅作接入预留，尚无MCP服务。

## 数据与口径

初始化文件见 `outputs/mock-2025`。绩效=KPI70%+交付30%，能力=测评50%+上级30%+价值观20%。两个轴分别采用高中低25%/50%/25%，以二级组织为边界，使用最大余数法取整，余数同分按中、高、低排序。评分保留两位小数后同分按员工编号排序。试用期员工目前纳入；以上口径为首版测试默认值。

修改模型或导入数据会创建新模型版本，旧校准不再应用但仍保留留痕。组织AI分析按选定二级组织完整人群运行，不受姓名、岗位、小组筛选影响。九宫格建议比例参考使用当前显示范围作分母。

## PostgreSQL

配置 `DATABASE_URL` 后自动建立 `talent_state` 表，以版本化JSONB文档保存工作区，事务行锁防止覆盖。当前为单工作区原型；正式多租户上线前应迁移为员工、年度快照、模型版本、校准事件等关系表并接入组织权限与SSO。此版本没有假装实现完整企业身份系统，操作人标为本地盘点管理员。

本地默认仅监听127.0.0.1。对外部署须配置 `APP_ACCESS_TOKEN`，页面会要求访问令牌（仅存sessionStorage）；API同样要求 `Authorization: Bearer TOKEN`。生产应使用HTTPS和正式身份鉴权。

## API约定

`GET /api/state` 返回 revision。写接口提交该 revision，过期时拒绝并提示刷新。

```json
{"revision":1,"cycle":"REVIEW-2025","employees":["使用完整员工对象替换此占位字符串"]}
```

POST `/api/employees` 为当前年度全量替换，调用前先备份。POST `/api/import` 使用FormData，字段file、revision、cycle；preview=true仅校验。返回错误不会写入状态。

## 后续接入

真实AI供应商、凭据管理、后台批量任务、MCP连接器及企业身份/组织级权限仍需接入。AI Mock不是大模型评价，也不作为人事决策依据。
