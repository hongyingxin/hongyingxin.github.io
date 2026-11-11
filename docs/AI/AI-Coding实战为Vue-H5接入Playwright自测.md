# AI Coding 实战：为 Vue H5 接入 Playwright 自测

上一篇[如何选择自测框架](/AI/AI-Coding如何选择自测框架.md)介绍了不同工具的用途。这一篇结合一个实际的 Vue H5 活动项目，说明如何让 AI 编写并执行浏览器自测。

项目采用 Vue 3、Vite、Vant 和 Axios，使用 Hash 路由，包含组队充值、财富狩猎、首充和国庆活动等页面。下面选择首充活动作为示例。

**本文是基于现有代码整理的接入方案。项目尚未安装 Playwright，以下配置与用例需要按步骤落地；没有执行真实后端测试，也不将示例视为已经通过的联调记录。**

## 1. 先了解实际页面

写测试前，让 AI 阅读路由、页面、接口文档和登录态来源，比直接要求“生成 E2E”更有效。

首充页面的相关位置如下，路径均相对于 H5 项目根目录：

| 位置 | 内容 |
| --- | --- |
| `src/main.js` | 注册 `/first-recharge` 路由，使用 `createWebHashHistory()` |
| `src/views/firstRecharge/index.vue` | 页面展示、鉴权参数、接口请求和领取逻辑 |
| `scripts/api-docs.mjs` | 查询本地接口文档的脚本 |

可以先执行：

```bash
npm run api-docs:query -- /h5/new/user/pay/home
```

本地文档能查到首页接口，但查询结果的参数表只列出了 `uid`。实际页面还发送 `ticket`、`language`，因此测试需要同时核对代码与后端鉴权约定，不能把简略参数表当成完整协议。

从当前页面可以确认：

- 首页接口是 `GET /h5/new/user/pay/home`。
- 领取接口是 `POST /h5/new/user/pay/receive`，参数放在 URL query 中，包含 `dutyId`。
- 页面使用业务码 `code === 200` 判断成功。
- 首页响应中的 `data.duty` 会转换为充值档位，至少有三个档位才展示主要卡片。
- `num` 和 `completeNum` 在前端除以 100 后显示为美元金额。
- `receive` 为真时显示已领取；否则根据完成进度显示可领取或未完成。

这几个事实决定了后面应该断言什么。

## 2. H5 没有登录页，凭证从哪里来

这个页面在 App 内通过原生桥取得 `uid`、`ticket` 和语言。在普通浏览器中，已有调试分支会读取 URL 参数：

```text
/#/first-recharge?dev=1&uid=TEST_UID&ticket=VALID_TICKET&lang=zh
```

因此第一批测试可以复用这个入口，不必增加账号密码登录页，也不必立即模拟原生桥。

真实接口测试需要使用有效的测试凭证。Mock 测试可以使用占位凭证，因为请求由测试代码拦截。

这里验证的是“已有身份的用户如何使用页面”，不覆盖 App 如何取得凭证、原生桥是否正常等流程。

下文默认项目已经连接测试环境，沿用现有请求配置，不调整业务代码或接口域名。测试凭证均使用占位值。

## 3. 安装与目录组织

在 H5 项目根目录执行，沿用仓库使用的包管理器：

```bash
pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

建议先只安装 Chromium，把首条链路跑通后再扩展浏览器范围。

```text
playwright.config.js
tests/e2e/
├── helpers/
│   └── activity.js
├── firstRecharge.real.spec.js
└── firstRecharge.mock.spec.js
```

在 `package.json` 的 `scripts` 中合并以下脚本：

```json
{
  "test:e2e": "playwright test",
  "test:e2e:real": "playwright test --project=real",
  "test:e2e:mock": "playwright test --project=mock"
}
```

在 `.gitignore` 中补充：

```text
playwright-report/
test-results/
```

`.env.local` 已由项目的 `*.local` 规则忽略。下面示例通过进程环境变量读取测试身份；Playwright 配置不会因为存在 `.env.local` 就自动加载其中的 `E2E_*` 变量。

## 4. 配置 Playwright

新增 `playwright.config.js`：

```js
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    ...devices['Pixel 7'],
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    { name: 'real', testMatch: '**/*.real.spec.js' },
    { name: 'mock', testMatch: '**/*.mock.spec.js' },
  ],
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: false,
  },
})
```

固定服务端口，并禁止复用其他服务，可以减少误连到旧代码或其他环境的情况。若端口被占用，应先处理冲突。

这里使用移动端视口和触摸模拟，关闭自动截图与视频，保留失败 Trace。Trace 可能包含 DOM 和网络中的凭证，作为本地调试资料使用，分享前应处理敏感内容。

## 5. 统一构造活动入口

新增 `tests/e2e/helpers/activity.js`：

```js
export const HOME_PATH = '/h5/new/user/pay/home'

export function activityUrl({ uid, ticket, lang = 'zh' }) {
  const params = new URLSearchParams({ dev: '1', uid, ticket, lang })
  return `/#/first-recharge?${params}`
}

export function realIdentity() {
  const uid = process.env.E2E_UID
  const ticket = process.env.E2E_TICKET

  if (!uid || !ticket) {
    throw new Error('真实联调需要设置 E2E_UID 和 E2E_TICKET')
  }

  return { uid, ticket }
}
```

使用 `URLSearchParams` 可以正确编码凭证中的特殊字符。缺少真实凭证时明确报错，避免测试什么都没做却显示通过。

## 6. 第一条真实接口用例

新增 `tests/e2e/firstRecharge.real.spec.js`：

```js
import { expect, test } from '@playwright/test'
import { HOME_PATH, activityUrl, realIdentity } from './helpers/activity.js'

test('真实首页响应与充值档位展示一致', async ({ page }) => {
  const identity = realIdentity()

  // 本用例只验证读取链路，发现业务写请求立即阻断并记录。
  const blockedWrites = []
  await page.route('**/h5/**', async (route) => {
    if (!['GET', 'OPTIONS'].includes(route.request().method())) {
      blockedWrites.push(route.request().method())
      await route.abort()
      return
    }
    await route.continue()
  })

  // 先注册监听，再打开页面，避免错过快速返回的响应。
  const homePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return url.pathname.endsWith(HOME_PATH)
      && response.request().method() === 'GET'
  })

  await page.goto(activityUrl(identity))
  const response = await homePromise
  expect(response.status()).toBe(200)

  const query = new URL(response.url()).searchParams
  expect(query.get('uid')).toBe(identity.uid)
  expect(query.get('language')).toBe('zh')
  // 凭证不一致时只输出布尔值，避免把原文写进断言日志。
  expect(query.get('ticket') === identity.ticket).toBe(true)

  const body = await response.json()
  expect(body.code).toBe(200)
  expect(Array.isArray(body.data?.duty)).toBe(true)
  expect(body.data.duty.length).toBeGreaterThanOrEqual(3)

  const cards = page.locator('.tier-card')
  await expect(cards).toHaveCount(3)

  for (const [index, duty] of body.data.duty.slice(0, 3).entries()) {
    const amount = Number(duty.num)
    expect(Number.isFinite(amount)).toBe(true)
    expect(amount).toBeGreaterThan(0)

    await expect(cards.nth(index).locator('.tier-title__amount'))
      .toHaveText(`$${(amount / 100).toFixed(2)}`)

    const state = duty.receive
      ? 'claimed'
      : Number(duty.completeNum || 0) >= Number(duty.num || 0)
        ? 'claimable'
        : 'incomplete'

    await expect(cards.nth(index).locator('.tier-button'))
      .toHaveClass(new RegExp(`tier-button--${state}(?:\\s|$)`))
  }

  expect(blockedWrites).toEqual([])
})
```

这里没有用模拟数据替换首页响应，GET 请求沿用页面现有配置访问真实测试后端。拦截器仅阻断意外写入，没有 Mock 首页内容。

运行前，测试账号需要处于活动可用期，后端需要为它返回至少三个档位。账号过期、凭证失效或活动未配置时，测试会失败，需要根据响应区分环境问题与代码问题。

这条用例证明了接口联通、业务响应成功，以及金额和按钮状态与返回值一致。它仍然不能独立证明后端奖励计算正确；要验证这一点，还需要准备已知充值记录和预期奖励的固定测试数据。

执行：

```bash
export E2E_UID='测试用户ID'
export E2E_TICKET='有效测试凭证'
pnpm test:e2e:real --headed
```

`--headed` 会显示浏览器操作过程。凭证应按测试环境的获取方式提供，失效后重新获取。

## 7. 用 Mock 稳定验证三种按钮状态

真实测试账号不一定同时具有未完成、可领取和已领取的任务。这个场景用 Mock 更容易重复执行。

新增 `tests/e2e/firstRecharge.mock.spec.js`：

```js
import { expect, test } from '@playwright/test'
import { HOME_PATH, activityUrl } from './helpers/activity.js'

test('三个档位分别展示未完成、可领取和已领取', async ({ page }) => {
  const unexpectedApi = []

  // 导航前拦截所有请求；仅允许本地页面资源与已定义的首页响应。
  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const local = url.origin === 'http://127.0.0.1:5173'

    if (url.pathname.endsWith(HOME_PATH) && request.method() === 'GET') {
      await route.fulfill({
        headers: { 'access-control-allow-origin': '*' },
        json: {
          code: 200,
          data: {
            endTime: Date.now() + 86_400_000,
            duty: [
              { id: 1, num: 100, completeNum: 0, receive: false, reward: [] },
              { id: 2, num: 500, completeNum: 500, receive: false, reward: [] },
              { id: 3, num: 1000, completeNum: 1000, receive: true, reward: [] },
            ],
          },
        },
      })
      return
    }

    if (!local || url.pathname.startsWith('/api-')
      || url.pathname.startsWith('/h5/')) {
      unexpectedApi.push(`${request.method()} ${url.pathname}`)
      await route.abort()
      return
    }

    await route.continue()
  })

  await page.goto(activityUrl({ uid: 'mock-user', ticket: 'mock-ticket' }))

  const cards = page.locator('.tier-card')
  await expect(cards).toHaveCount(3)
  await expect(cards.nth(0).locator('.tier-button')).toHaveText('未完成')
  await expect(cards.nth(1).locator('.tier-button')).toHaveText('领取')
  await expect(cards.nth(2).locator('.tier-button')).toHaveText('已领取')
  await expect(cards.nth(1).locator('.tier-title__amount')).toHaveText('$5.00')
  expect(unexpectedApi).toEqual([])
})
```

Mock 数据按当前前端读取的字段构造，不代表完整后端响应协议。它验证页面状态与金额显示，真实接口兼容性仍由上一条联调用例负责。

这里只允许本地资源和显式定义的首页接口，其余外部请求会阻断。若页面后续新增接口依赖，应补充对应 Mock，不能简单放行全部请求。

执行时不需要真实账号：

```bash
pnpm test:e2e:mock
```

## 8. 领取奖励如何验证

首批真实用例可以先保持只读。领取奖励有实际副作用，需要后端准备可重置的测试账号与任务，再单独增加写入测试。

完整验证链路应当是：

```text
查询首页，确认指定 dutyId 可领取
  → 点击该档位领取按钮
  → 检查 POST 的 uid、language、dutyId 与有效凭证
  → 检查 HTTP 状态和业务码
  → 等待页面自动重新查询首页
  → 确认同一 dutyId 的 receive 已变为 true
  → 确认页面显示已领取
```

当前领取接口的参数位于 URL query，不能只检查 `request.postDataJSON()`。应在点击前同时注册领取响应和后续首页响应的监听。

测试数据恢复应通过测试环境支持的重置方式完成，不应猜测一个“撤销领取”接口。充值跳转、实际发奖到账和 App 原生交互也需要分别确定验证方式。

## 9. 让 AI 按明确边界执行

有了配置和样例后，可以把自测要求写进项目规则或 skill。例如：

```text
请针对首充活动执行自测：

1. 阅读页面、路由和本地接口文档，确认字段与凭证来源。
2. 沿用项目默认测试环境，不调整接口域名。
3. 先执行 Mock 用例，再执行只读真实接口用例。
4. 缺少有效凭证时报告阻断，不伪造联调通过结果。
5. 不执行领取、充值或其他写入，除非任务明确包含这些场景。
6. 断言失败必须保留失败状态，不用 return、放宽断言或增加重试掩盖。
7. 不主动截图；需要视觉审核时按项目要求执行。
8. 汇报运行命令、通过与失败数量、Mock 范围、真实接口范围和未覆盖项。
```

本项目已有“不自动截图”的规则。编写测试、实际启动浏览器和视觉审核是不同操作，执行时仍需遵循当前任务授权与项目规则。

先检查用例能否被收集，再实际运行：

```bash
pnpm exec playwright test --list
pnpm test:e2e:mock
pnpm test:e2e:real
pnpm exec playwright show-report
```

用例收集成功只说明测试文件可以加载；Mock 通过只说明给定数据下的前端行为符合预期；真实接口用例通过也只覆盖已执行的账号、环境与业务场景。

对于这个 H5 项目，第一步可以是一个真实读取用例加一个 Mock 状态用例。随后再围绕领取失败、重复点击、多语言和原生交互逐步补充，把每次自测得到的结论与证据对应起来。

## 10. 编写供 AI 调用的自测 Skill

每次都粘贴一遍测试要求比较繁琐，可以把它整理成项目级 Skill。Skill 负责告诉 AI 如何选择用例、执行命令和解释结果；实际浏览器操作仍由 Playwright Test 完成。

这种方式只需要 Agent 能在项目中执行终端命令，不依赖 Playwright MCP。MCP 更适合临时探索页面，已有 spec 的回归测试可以直接走 CLI。

### 创建 Skill 文件

以当前项目使用的 Cursor 为例，可以创建：

```text
.cursor/skills/h5-self-test/
└── SKILL.md
```

下面是一份可作为起点的内容。它依赖前文的 Playwright 配置与测试脚本，保存 Skill 文件本身不会自动安装框架或生成用例。

````markdown
---
name: h5-self-test
description: 当用户要求对 H5 活动进行自测、页面回归或真实接口联调时使用。选择对应 Playwright 用例，执行 Mock 与真实接口测试，分析失败并输出验证报告。
---

# H5 活动自测

## 输入与范围

- 根据用户给出的活动名、路由或文件确定目标页面。
- 先检索已有路由与 spec；目标无法唯一确定时询问，不默认测试全部活动。
- 默认沿用项目测试环境，不修改接口域名。
- 真实接口身份从 E2E_UID、E2E_TICKET 读取，不输出原文。
- 默认执行 Mock 和真实只读用例；只有任务明确包含写入时才执行写入场景。
- 遵循项目的浏览器与截图规则，不主动截图或打开交互式报告。

## 执行步骤

1. 检查 package.json、Playwright 配置和已有 spec，确认工具链已接入。
   缺少依赖、配置或脚本时先报告；用户要求接入时再完成安装与配置。
2. 阅读目标页面及本地接口文档，列出本次验证的接口、参数和页面行为。
3. 优先复用对应 spec。新增用例时分别使用 .mock.spec.js 与 .real.spec.js，
   不把 Mock 验证描述为真实接口联调。
4. 执行目标文件的用例收集，确认没有导入错误，再执行对应 Mock 用例。
5. 检查真实凭证是否存在；仅检查存在性，不把值写入命令、日志或报告。
   凭证缺失时继续完成不依赖凭证的检查，将真实联调标记为未执行。
6. 执行目标真实只读用例。发生鉴权失败时报告凭证问题，不伪造身份继续测试。
7. 若任务包含写入，先核实专用测试数据和可用的清理方式；不要猜测重置接口。
8. 对失败保留断言和退出码，结合请求、页面与 Trace 分析原因。
   用户要求修复时处理相关问题，再重跑受影响的用例。

## 首充活动命令示例

在项目根目录执行，只选择目标文件：

```bash
pnpm exec playwright test firstRecharge --list
pnpm exec playwright test firstRecharge.mock.spec.js --project=mock
pnpm exec playwright test firstRecharge.real.spec.js --project=real
```

执行其他活动时，根据已有文件名替换过滤条件，不直接复制首充场景。

## 断言要求

- 查询检查请求参数、HTTP 状态、业务码和页面展示。
- 保存或领取检查提交参数、业务响应，以及重新查询后的同一条记录。
- 数据为空是否合理取决于场景；需要固定记录时，缺少记录不能算通过。
- 交互失败使用断言，不用 console.log 后 return 代替失败。
- 不通过删除断言、放宽预期或增加重试来掩盖问题。
- 不把“用例收集成功”写成“业务测试通过”。

## 输出报告

- 目标页面与执行范围。
- 执行命令和实际退出结果。
- Mock 与真实接口分别通过、失败、跳过的数量。
- 未执行项及原因，例如缺少凭证、服务不可用或测试数据不满足条件。
- 发现的问题、涉及文件及修复后的复验结果。
- 未覆盖的业务流程与 App 原生交互。

报告不包含真实域名、IP、有效凭证、完整鉴权 URL 或未经处理的 Trace。
````

### 如何让 AI 使用

保存后，可以在对话中明确点名 Skill 并给出目标，避免依赖自动匹配：

```text
使用 h5-self-test，对 /first-recharge 做自测。
先跑 Mock，再用当前环境变量中的测试身份执行真实只读联调。
本次不领取奖励，输出通过、失败和未执行项。
```

如果希望 AI 同时修复，可以补充：

```text
修复本次发现的前端问题，并重跑受影响的用例。
后端错误或凭证失效请单独报告，不通过修改 Mock 数据掩盖问题。
```

Skill 的目录位置与调用方式随 Agent 产品而异；迁移到其他工具时，应按对应工具的项目 Skill 约定放置。文章中的文件仅为模板，没有写入实际 H5 项目。

### 报告要区分验证范围

一次自测结束后，报告可以采用这样的形式，以下数字仅作格式示例：

```text
页面：/first-recharge
Mock：1 通过，0 失败
真实只读联调：未执行，缺少 E2E_TICKET
领取奖励：未执行，不在本次范围
App 原生桥：未覆盖
结论：模拟数据下的按钮状态验证通过，真实接口链路尚未验证。
```

这样即使 AI 已经完成可执行的检查，也不会把缺少凭证、未覆盖或被阻断的部分算作通过。后续补齐条件后，可以复用同一个 Skill 继续验证。
