# 紫微斗数与易经研习

一个用于学习和使用紫微斗数、易经的网页。页面提供本地研习记录生成，也预留了千问模型接口。

## 当前功能

- 首页分为公开自测和内测研习两条路径
- 紫微斗数与易经入门学习路径
- 出生信息与问题记录表单
- 本地基础研习记录生成
- 基于 `iztro` 的紫微斗数十二宫排盘，含阳历/阴历、闰月、时分、地点、盘式和流年输入
- YouTube 视频课程播放列表嵌入
- 千问模型补充解读接口预留

## 产品路径

公开自测用于访客输入资料、生成命盘、获得基于盘面依据的解释。内测研习用于课程学习、术语积累、案例复盘和 AI 学习辅导。

## 本地预览

```bash
node server.mjs
```

打开 `http://localhost:4173`。

## 接入千问

部署到 Vercel 后，在项目环境变量里添加：

```text
DASHSCOPE_API_KEY=你的阿里云百炼 API Key
QWEN_MODEL=qwen-plus
```

`QWEN_MODEL` 可选，默认使用 `qwen-plus`。

## 查命盘

网站通过开源库 `iztro` 生成紫微斗数命盘。接口为：

```text
POST /api/astrolabe
```

请求字段：

```json
{
  "calendarType": "lunar",
  "date": "1981-5-6",
  "timeIndex": "4",
  "gender": "male",
  "isLeapMonth": false
}
```

## 部署到 Vercel

这个项目是静态页面加一个 Vercel Serverless API。导入 GitHub 仓库后，Vercel 可以直接部署，无需构建命令。
