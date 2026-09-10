# Evella

> Manifest it. Then live it.

面向北美年轻女性的显化 / 正念音频 app。说出你想要的，拿回一段用你自己的话写成、并念给你听的三分钟音频。

这个仓库里是**落地页**和**前端原型**。

---

## 现在要部署的是 `site/`

落地页，给 TikTok 导流用。

**线上**：https://belendali.github.io/evella/site/

### 技术情况

- **纯静态**：`index.html` + `style.css` + `img/`，一共 16 个文件、1.3 MB
- **没有构建步骤**，没有 npm、没有打包器。丢进任何静态托管就能跑
- **唯一的外部依赖是 Google Fonts**（Fraunces + Inclusive Sans）。内网或墙内部署要考虑自托管字体
- 所有 JS 内联在 `index.html` 里，没有外部脚本

### 部署

当前走 GitHub Pages，从 `main` 分支根目录发布，**push 到 main 就自动上线**，没有别的流程。

换到别的托管（Vercel / Netlify / S3）：把 `site/` 整个目录当根目录发布即可，构建命令留空。

---

## ⚠️ 上线前必须做的两件事

### 1. 等待名单现在收不到邮箱

`site/index.html` 里：

```js
const WAITLIST_ENDPOINT = '';
```

**这一行是空的。**现在用户填了邮箱只写进他自己浏览器的 localStorage —— 流程走得通、他也看到「You're on the list」，但**你一个邮箱都收不到**。投流之前不填，等于钱花了、人来了、名单是空的。

填一个 HTTPS 地址即可，页面会往那儿发：

```
POST <地址>
Content-Type: application/json

{ "email": "...", "source": "evella-landing" }
```

服务端要求：

- **必须 HTTPS**（页面在 https 上，http 接口会被浏览器当混合内容拦掉）
- **必须开 CORS**，允许来源 `https://belendali.github.io`（换自有域名后要一起加）
- **必须处理 `OPTIONS` 预检** —— 我们发的是 `application/json`，浏览器会先发预检。漏了这条的话请求根本发不出去，而且用户那边看不出任何异常
- 返回 2xx 即算成功，返回体不用管；非 2xx 前端会走失败提示
- 建议做：邮箱去重、基础频率限制（这个地址是公开的）、记录时间戳和来源

> 不想自己写后端：Formspree / Tally 注册完直接给一个地址，格式一样、CORS 已配好，5 分钟能通。之后要做邮件营销再迁到自己的接口，前端仍然只改这一行。

### 2. 域名

现在是 `belendali.github.io/evella/site/`。真投放前买域名绑上，CORS 白名单要同步改。

---

## 目录说明 —— 哪些是活的，哪些别碰

| 目录 | 状态 | 说明 |
|---|---|---|
| **`site/`** | ✅ **活的** | 落地页。当前维护的就是这个 |
| **`app/`** | ✅ **活的** | 前端原型，端到端跑通全流程。iOS 开发的行为参考 |
| `docs/` | 📖 参考 | 八份产品文档。**内容尚未跟上最新的品牌和定价，见下方待办** |
| `product/` | ⚠️ **另一条线** | 带 Python 后端 + Claude 写稿的版本。**不是当前这条线，别照着做** |
| `site-dark/` | ❌ 作废 | 被否掉的深色备选方案 |
| `demo/` | ❌ 作废 | 早期视觉原型 |
| `covers/` | 🔧 工具 | 生成封面图和颗粒纹理的 Python 脚本 |

---

## 前端原型 `app/`

**线上**：https://belendali.github.io/evella/app/

iOS 开发主要看这个 —— 交互行为、流程顺序、动效节奏都在里面，比看静态设计稿准。

用 **Chrome 或 Safari** 打开（语音识别只有这两家支持），**戴耳机**。

主链路：

```
Home 点麦克风 → 说一句你想要的 → 看转写 → 确认
   → 生成 → 三选一 → 播放
```

除了「生成」是本地模板，其余都是真的：麦克风真在听、波形跟随真实音量、音频真能播完。

三段真录音的独立页面（做运营素材时用的）：

- https://belendali.github.io/evella/app/listen/1/
- https://belendali.github.io/evella/app/listen/2/
- https://belendali.github.io/evella/app/listen/3/

音色来自 fish.audio：1、2 是 `Emili meditation`（`b92c032afbca4a928cefe0b073a686fb`），3 是 `Calm Meditation Guide`（`f8830ab5e40847f68362cc4dad0e1125`）。

---

## 设计源

Figma 文件 key：`PPZcQQzUXijyD4ZxcSaJ93`

三个页面：

- **📱 Product** —— 主流程、Onboarding、Library、Me、Widget、App Store 图
- **Evella 1.0** —— 当前迭代，含订阅生命周期、头像拍摄与裁切
- **🎨 Foundations** —— 设计系统：变量、文字样式、组件

落地页的设计 token（颜色、字体、渐变、投影）沿用 app 的同一套，定义在 `site/style.css` 顶部的 `:root` 里。

### 定价

**单一档位 `$6.99 / 周`**，7 天免费试用。Figma 里的订阅相关界面都已按这个改过。

---

## 落地页的调参面板

做视觉时留的实时调参面板，普通访客看不到：

```
https://belendali.github.io/evella/site/?tune=1
```

可调水面透明度、混合模式、球的深浅和亮度。调好点 Copy 得到一行数值，写回源码即可。

整个面板由 JS 生成，且只在带 `?tune=1` 时创建 —— 不带参数时页面 DOM 里连节点都没有，**可以安全地留在生产代码里**。

---

## 几个已知的坑（改代码前先看）

这些都是踩过之后才修好的，别踩回去：

1. **`.hero` 和 `body` 都不能有 `overflow`** —— 祖先上任何 `overflow` 都会让 `position: sticky` 失效，hero 的整套滚动编排会当场失灵。
2. **大面积 `backdrop-filter` + `filter: blur` 会压垮浏览器合成器**，滚动时整屏白掉。现在只在几个小胶囊上用了 `backdrop-filter`，颗粒层是按 section 分块铺的 —— 不要改成整页一层 `fixed`。
3. **canvas 动画里 `requestAnimationFrame` 要排在函数开头** —— 排在末尾的话，任何一次绘制异常都会让整个循环永久停摆，而且表现是「动画根本没生效」，很难查。
4. **iOS Safari 的 `backface-visibility: hidden` 在带 `overflow: hidden` 和圆角的元素上会失效**，3D 翻卡会露出镜像文字。现在两面额外加了透明度交叉淡出兜底，别删。
5. **输入框字号不能低于 16px** —— iOS 上聚焦会把整页放大。
6. **CSS 的 `transform` 是整条替换的，不是叠加** —— 居中用的 `translateX(-50%)` 很容易被 hover / focus 状态里的 `translateY` 冲掉，元素会突然横跳半个身位。
7. **GitHub Pages 有缓存**：改了 CSS/JS 一定要抬 `index.html` 里的 `?v=` 版本号，否则回访的人吃到旧代码。

---

## 待办

- [ ] 填 `WAITLIST_ENDPOINT`（**上线阻塞项**）
- [ ] 买域名并绑定，同步改 CORS 白名单
- [ ] `docs/` 八份文档尚未跟上：里面仍是旧的品牌设定和「只做月/年订阅」的旧定价结论，与现在的 `$6.99/周` 冲突。**以 Figma 和本文件为准**
- [ ] App 图标尚未随品牌更新
