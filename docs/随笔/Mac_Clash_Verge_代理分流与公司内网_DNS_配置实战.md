---
hidden: true
---

# Mac Clash Verge 代理分流与公司内网 DNS 配置实战

整理日期：2026-11-02（Asia/Shanghai）  
文件格式：Markdown · UTF-8  
适用环境：macOS、Clash Verge Rev；本次读取的应用版本为 2.5.2。

> 来源说明：原对话《访问页面状态》的助手总结正文在读取时仅返回引用占位符，无法逐字恢复。本文件依据已恢复的用户消息、附件截图及本次只读核对的本机配置整理，保留实际 DNS、域名、Merge YAML 和 DIRECT 规则。排查记录只写有证据的部分；curl 等命令作为后续复验指南，不冒充历史执行输出。本次未改动代理、系统 DNS 或 hosts，也未重新访问公司服务。

## 1. 最终方案与关键结论

这次配置的核心是同时处理两件事：**内网域名由公司 DNS 解析，指定内网站点的访问流量走 DIRECT。**

| 配置项 | 已核对的值或状态 |
| --- | --- |
| 公司 DNS | `192.168.20.238`、`192.168.20.239` |
| 指定使用公司 DNS 的域名范围 | `+.evkland.cn`、`+.xf.io` |
| 排除 Fake-IP 的域名范围 | `+.evkland.cn`、`+.xf.io` |
| 前置直连规则 | `DOMAIN,git.xf.io,DIRECT`；`DOMAIN,newlangdocs.evkland.cn,DIRECT` |
| 配置模式 | `mode: rule` |
| 本地混合代理端口 | `mixed-port: 7897` |
| 系统代理设置 | 保存的应用设置为开启 |
| TUN 设置 | 保存的应用设置及生成配置均为关闭 |
| 最终用户反馈 | 原对话明确反馈“可以访问了” |

DNS 分流覆盖两个域名后缀，但本次明确前置 DIRECT 的只有两个完整域名。**不能据此认为所有 `evkland.cn`、`xf.io` 子域名都已被设置为直连。**

上述应用开关、端口和规则来自磁盘上的当前配置；它们不等于本次重新测得的实时网络结果。实际系统 DNS 的证据来自原对话中的 `scutil --dns` 输出。

## 2. 问题背景与处理目标

公司内部服务使用域名访问，部分服务对应 `192.168.20.x` 私网地址；同时，Mac 通过 Clash Verge 使用代理访问其他网站。需要保留正常代理能力，并让公司内部服务稳定访问。

两个环节必须分别检查：

1. **解析环节**：域名能否通过正确的 DNS 得到公司提供的地址。
2. **连接环节**：Clash 是否按规则从本机直接连接该地址，而非交给远端代理节点。

DIRECT 不能替代 DNS 配置；DNS 解析正确也不能证明路由规则正确。根据本次保存的配置，可以解释方案为何有效，但由于原始失败日志未恢复，不能把某一条错误日志或唯一根因补写成历史事实。

## 3. 实际公司 DNS 证据

原对话中用户在 Mac 终端执行了：

```bash
scutil --dns
```

原始输出的关键部分如下：

```text
DNS configuration

resolver #1
  nameserver[0] : 192.168.20.238
  nameserver[1] : 192.168.20.239
  if_index : 12 (en0)
  flags    : Request A records
  reach    : 0x00000002 (Reachable)

DNS configuration (for scoped queries)

resolver #1
  nameserver[0] : 192.168.20.238
  nameserver[1] : 192.168.20.239
  if_index : 12 (en0)
  flags    : Scoped, Request A records
  reach    : 0x00000002 (Reachable)
```

这是本次采用 `.238` 和 `.239` 的直接依据。不要凭网关地址或其他机器的配置猜测公司 DNS，也不要把 `.210`、`.201` 等业务服务器地址填进 DNS 服务器列表。

`Reachable` 是当时系统报告的可达性状态，不能代替针对具体域名的 DNS 查询验证。其余 `local`、反向解析域等 mDNS resolver 不属于这两台公司 DNS 的替代项。

本次文档整理环境重新调用 `scutil --dns` 返回 `No DNS configuration available`，因此没有产生可替换上述历史记录的新系统 DNS 结果。

## 4. 内网及公司业务域名清单

下面的 IP 映射来自原对话中同事提供的 hosts 清单，按域名整理。**这是历史参考清单，不是本次逐项 DNS 查询结果，也不代表这些条目已经写入本机 hosts。**

| 域名 | 同事清单中的地址 | 维护备注 |
| --- | --- | --- |
| `yapi.xf.io` | `192.168.20.210` | 历史业务地址 |
| `git.xf.io` | `192.168.20.82`、`192.168.20.83` | 原清单同一域名有两个不同地址；需由 DNS 或管理员确认现状 |
| `grafana.evkland.cn` | `8.210.126.208` | 公网地址，不能仅凭公司域名判定为私网服务 |
| `ops.evkland.cn` | `192.168.20.12` | 历史业务地址 |
| `newlangdocs.evkland.cn` | `192.168.20.201` | 历史业务地址；本次有明确 DIRECT 规则 |
| `jenkins.xf.io` | `192.168.20.99` | 历史业务地址 |
| `ultron.xf.io` | `192.168.20.235` | 历史业务地址 |
| `jms.xy.aliyun` | `47.243.203.112` | 原清单重复出现；不在本次两个 DNS 后缀策略内 |
| `jenkins.aliyun.ixingfei.cn` | `101.37.150.20` | 不在本次两个 DNS 后缀策略内 |
| `ultron.aliyun.ixingfei.cn` | `101.37.150.20` | 不在本次两个 DNS 后缀策略内 |
| `raw.githubusercontent.co` | `185.199.108.133` | 原清单如此拼写；若目标是 GitHub Raw，此处疑似漏写末尾 `m`，不能直接照抄 |

同事清单还含有 `127.0.0.1 localhost`、`255.255.255.255 broadcasthost`、`::1 localhost` 等系统默认项目。这些不是本次公司 DNS 分流的新增配置。

本次只读检查 `/etc/hosts` 时，未发现上述 `xf.io`、`evkland.cn`、`ixingfei.cn`、`xy.aliyun` 或 `raw.githubusercontent` 相关映射。维护时应以已采用的 DNS 方案为主，不要把同事的整份历史清单当作必需配置直接覆盖到 hosts。

## 5. 可恢复的排查与落地过程

| 阶段 | 已有证据 | 可以得出的结论 |
| --- | --- | --- |
| 规则配置 | 当前订阅的规则扩展文件包含两条前置 DIRECT，文件修改时间为 2026-10-30 18:11:38（北京时间） | 指定站点的直连规则已经单独保存；时间是文件元数据，不代表完整操作日志 |
| 检视 hosts 方案 | 用户贴出同事提供的 hosts 清单 | 存在公司业务域名和私网地址映射；重复、旧地址和拼写需核对 |
| 确认公司 DNS | 用户贴出 `scutil --dns` 完整输出 | 实际 DNS 为 `192.168.20.238` 和 `192.168.20.239` |
| 找到 Merge 编辑入口 | 原对话截图显示 Clash Verge 的“编辑文件”窗口及 Merge 模板注释 | 用户已进入扩展配置编辑位置；该截图尚未展示最终 YAML |
| 保存 DNS 分流 | 本机订阅 Merge 文件含两个域名后缀策略和 Fake-IP 排除列表，修改时间为 2026-11-02 09:57:42 | 最终持久化的 DNS 配置可被完整保留 |
| 生成配置 | `clash-verge.yaml` 修改时间为 2026-11-02 09:57:43，包含 DNS 策略和前两条 DIRECT | 保存的生成配置已包含这些修改 |
| 用户确认恢复 | 用户随后明确表示“可以访问了” | 原对话有恢复访问的用户确认；不补写缺失的 HTTP 状态码、curl 输出或日志 |

保留下来的过程说明：先核对环境，再把公司 DNS 解析与指定域名直连分别配置，最后核对生成结果与访问情况。若将来故障复发，仍按这两个环节逐层排查。

## 6. 实际 Clash Merge YAML

### 6.1 当前订阅扩展配置原文

以下内容直接来自本机当前订阅引用的 Merge 文件，未替换 DNS、域名或增加新的策略：

```yaml
# Profile Enhancement Merge Template for Clash Verge

# 公司内网 DNS 分流
dns:
  nameserver-policy:
    "+.evkland.cn":
      - 192.168.20.238
      - 192.168.20.239
    "+.xf.io":
      - 192.168.20.238
      - 192.168.20.239

  fake-ip-filter:
    - "+.evkland.cn"
    - "+.xf.io"
```

这是一段 **Merge／扩展配置**，不是可单独替代整个订阅的完整 Clash 配置。它没有包含节点、策略组或订阅全部规则。

`nameserver-policy` 为匹配域名指定 DNS；`fake-ip-filter` 在默认 blacklist 模式下使匹配域名不返回 Fake-IP。两者都不自动创建 DIRECT 规则，也不自动更改 macOS 系统 DNS。[Mihomo DNS 配置说明](https://wiki.metacubex.one/config/dns/)

### 6.2 配置保存位置与作用范围

本机 Clash Verge 数据目录为：

```text
~/Library/Application Support/io.github.clash-verge-rev.clash-verge-rev/
```

| 文件（相对于上述目录） | 本次用途 |
| --- | --- |
| `profiles.yaml` | 当前订阅标识及其扩展文件关联 |
| `profiles/mkmmQcYKyelx.yaml` | 本次公司 DNS 的订阅 Merge 配置 |
| `profiles/r1tTvIIDjZzp.yaml` | 本次两条 DIRECT 的规则扩展 |
| `profiles/Merge.yaml` | 全局 Merge；目前只有 `profile.store-selected: true`，没有本次公司 DNS 策略 |
| `clash-verge.yaml` | 生成配置，可用于核对最终合并结果 |
| `verge.yaml` | 应用保存的系统代理、TUN、端口等设置 |

当前订阅标识为 `RzOJKorqXwNg`，关联的 `merge` 为 `mkmmQcYKyelx`，`rules` 为 `r1tTvIIDjZzp`。这些文件名是本机生成的标识，迁移、重新导入订阅或重装后可能变化。

维护入口优先使用 Clash Verge 的订阅右键菜单中的“扩展配置”和“编辑规则”。不要把 `clash-verge.yaml` 生成文件当作长期编辑入口，否则重新生成时可能丢失修改。

本次配置属于**当前订阅的扩展**。切换到另一份订阅后，必须确认新订阅也关联了所需 DNS 和规则配置，不能只因全局 Merge 文件存在就认为它们会自动继承。

## 7. 实际 DIRECT 规则

### 7.1 当前规则扩展文件原文

```yaml
prepend:
  - 'DOMAIN,git.xf.io,DIRECT'
  - 'DOMAIN,newlangdocs.evkland.cn,DIRECT'
append: []
delete: []
```

这段结构来自“编辑规则”对应的规则扩展文件，应与上一节的 DNS Merge 分开维护。

Clash Verge Rev 官方文档说明：从 `v1.7.x` 起，旧 Merge 的 prepend/append 功能移到订阅右键的可视化编辑器。不要把旧教程中的 `prepend-rules:` 直接当作本机 2.5.2 的通用 Merge 写法。[Clash Verge Rev 扩展配置说明](https://www.clashverge.dev/guide/extend.html)

### 7.2 生成配置中的顺序

本次读取的生成配置以如下规则开头，后续订阅规则在此省略：

```yaml
rules:
  - DOMAIN,git.xf.io,DIRECT
  - DOMAIN,newlangdocs.evkland.cn,DIRECT
```

域名规则按顺序匹配，因此将内网例外前置，能避免被后续更宽泛的规则先匹配。DIRECT 的含义是直接出站，仍需要本机具备到公司网络的通路。[Mihomo 路由规则](https://wiki.metacubex.one/config/rules/)

### 7.3 增加站点时的规则选择

若只需要新站点直连，在“编辑规则”的 prepend 中增加该站点的 `DOMAIN,完整域名,DIRECT`，保留现有两条规则。

只有在确认整个后缀下所有站点都应直连时，才考虑以下更宽的规则。**下面是备选维护示例，不是当前已应用配置：**

```text
DOMAIN-SUFFIX,xf.io,DIRECT
DOMAIN-SUFFIX,evkland.cn,DIRECT
```

特别是 `evkland.cn` 清单中包含公网业务地址，扩大范围前应确认这些服务的访问要求。

## 8. 保存、重载与配置核对

后续修改时按以下顺序操作：

1. 备份当前订阅的扩展配置和规则扩展。
2. 在正确的订阅上编辑 DNS Merge 或前置规则。
3. 保存，按应用提示应用或重新加载；确认没有 YAML 语法错误。
4. 检查生成配置：两个域名后缀是否仍指向 `.238/.239`，Fake-IP 排除是否保留，DIRECT 是否位于前面。
5. 通过下一节的显式代理请求和 Clash“连接／日志”检查规则命中。
6. 在浏览器中打开真实业务页面，检查登录、静态资源和业务请求。

当前生成配置的相关背景值是：

```yaml
mode: rule
mixed-port: 7897
tun:
  enable: false
dns:
  enable: true
  enhanced-mode: fake-ip
  respect-rules: true
```

上面是便于核对的字段摘录，不是完整配置，也不应单独用来覆盖现有文件。

升级时尤其留意合并行为：官方文档注明 `v2.5.5` 起，`dns` 下写出的字段（包括 `nameserver-policy`）按字段整体替换，未写出的 DNS 字段保留；列表也会整体替换。本次机器读取的是 2.5.2，不能把新版本规则直接倒推为旧版本行为。升级后应检查其他已有 DNS 策略、Fake-IP 排除项是否仍在最终配置中。[版本与合并规则说明](https://www.clashverge.dev/guide/extend.html)

## 9. DNS 与 curl 复验指南

以下是后续可在 Mac 上执行的复验命令。**原对话中完整 curl 命令和返回内容未恢复，本次整理也没有执行这些服务请求，因此这里不提供虚构的“成功输出”。**

### 9.1 检查系统 DNS 与系统解析

```bash
scutil --dns

dscacheutil -q host -a name git.xf.io
dscacheutil -q host -a name newlangdocs.evkland.cn
```

先确认处于公司网络或能够访问公司网络的连接环境。若 DNS 与历史值不同，应向网络管理员确认，而不是直接覆盖网络设置。

### 9.2 分别查询两台公司 DNS

```bash
dig @192.168.20.238 git.xf.io A +time=2 +tries=1
dig @192.168.20.239 git.xf.io A +time=2 +tries=1

dig @192.168.20.238 newlangdocs.evkland.cn A +time=2 +tries=1
dig @192.168.20.239 newlangdocs.evkland.cn A +time=2 +tries=1
```

记录 DNS 响应状态、应答地址及查询服务器。若超时，检查网络路径和 DNS 服务；若 `NXDOMAIN`，检查域名拼写及 DNS 记录。两台服务器的结果应符合公司预期，不要要求它们必须等于旧 hosts 清单的地址。

这些查询验证指定 DNS 服务器的回答，不代表 Clash 请求已使用该策略。

### 9.3 绕过 curl 显式代理进行对照

```bash
curl --noproxy '*' --connect-timeout 5 --max-time 15 -v -I \
  'http://git.xf.io/'

curl --noproxy '*' --connect-timeout 5 --max-time 15 -v -I \
  'https://newlangdocs.evkland.cn/'
```

`--noproxy '*'` 排除 curl 的显式代理设置；如果以后启用 TUN，流量仍可能被网络层接管，所以该命令不等于关闭 TUN。以上协议分别对应本次可见的站点使用方式，若公司入口变更，应改用实际 URL。[curl 参数说明](https://curl.se/docs/manpage.html)

### 9.4 明确通过 Clash 端口验证

本次读取的端口是 **7897**，不要直接套用其他教程的 7890。

```bash
curl --proxy 'http://127.0.0.1:7897' --noproxy '' \
  --connect-timeout 5 --max-time 15 -v -I \
  'http://git.xf.io/'

curl --proxy 'http://127.0.0.1:7897' --noproxy '' \
  --connect-timeout 5 --max-time 15 -v -I \
  'https://newlangdocs.evkland.cn/'
```

空的 `--noproxy ''` 用于避免环境中的 `NO_PROXY` 将请求绕过代理。与此同时，在 Clash 的连接详情或日志中检查目标域名及最终出站是否为 `DIRECT`。[curl 代理参数说明](https://curl.se/docs/manpage.html)

经过 Clash 本地端口，并不意味着最终一定走远端代理节点。预期路径是：

```text
curl / 浏览器 → Clash 本地端口 → 匹配 DIRECT → 本机连接公司服务
                                  └→ 对目标域名使用对应 DNS 策略
```

### 9.5 HEAD 不受支持时改用 GET

`-I` 使用 HEAD。有些服务会拒绝 HEAD，此时可用 GET 丢弃响应正文、只观察响应头：

```bash
curl --proxy 'http://127.0.0.1:7897' --noproxy '' \
  --connect-timeout 5 --max-time 15 -sS -D - -o /dev/null \
  'https://newlangdocs.evkland.cn/'
```

### 9.6 仅用于隔离 DNS 问题的指定地址测试

仅当管理员确认文档站当前地址仍是 `192.168.20.201` 时，才使用以下历史地址测试：

```bash
curl --noproxy '*' \
  --resolve 'newlangdocs.evkland.cn:443:192.168.20.201' \
  --connect-timeout 5 --max-time 15 -v -I \
  'https://newlangdocs.evkland.cn/'
```

`--resolve` 为该请求指定目标地址，绕过正常的目标 DNS 解析；即使成功，也不能据此宣告 DNS 已修复。它保留 URL 域名用于 HTTPS 校验，比直接访问 IP 更适合排查虚拟主机。[curl resolve 说明](https://curl.se/docs/manpage.html)

### 9.7 结果如何判读

| 结果 | 判断与下一步 |
| --- | --- |
| 无法解析域名 | 检查所用解析路径、公司 DNS 和域名记录 |
| DNS 查询超时 | 检查公司网络、路由及 DNS 服务可达性 |
| 连接 `127.0.0.1:7897` 失败 | 检查 Clash 是否运行、实际监听端口是否改变 |
| 目标连接超时 | 检查解析地址、DIRECT 命中、公司网络路由和服务端口 |
| HTTPS 证书校验错误 | 检查域名、证书链和系统时间；不能将忽略校验后的成功记为证书正常 |
| `200 Connection established` | 仅表示代理隧道阶段通过，还需查看后续 TLS 和站点响应 |
| 目标返回 200、301、302 | 服务已响应；跳转还需检查目标地址及业务页面 |
| 目标返回 401、403 | 可能已到达鉴权环节；核对响应来源和登录／权限，不能当作业务验证通过 |
| 直连成功、显式 Clash 请求失败 | 重点检查 Clash DNS、规则顺序、重载和实际生成配置 |
| curl 成功、浏览器失败 | 检查浏览器代理、缓存、安全 DNS，以及页面依赖的其他域名 |

curl 的这些参数行为可参见[官方手册](https://curl.se/docs/manpage.html)。HTTP 返回码与业务正常之间的区别应在复验记录中保留。

## 10. 后续维护指南

### 10.1 新增内网站点

1. 确认域名、协议、端口以及所需网络环境。
2. 查询公司 DNS，确认当前地址，不照抄旧 hosts 地址。
3. 若新域名已在 `xf.io` 或 `evkland.cn` 下，检查现有 DNS 策略是否匹配；新后缀则另行配置。
4. 若站点应直连，在规则扩展前置一条精确 DOMAIN 规则。
5. 保存后检查生成配置，再执行 DNS、显式 Clash curl 和浏览器验证。

### 10.2 公司更换 DNS

先以系统网络配置或管理员通知确认新地址，再更新两个 `nameserver-policy` 条目中的 DNS 列表。同步验证主、备解析服务器和实际站点，不要只改一处后认为所有域名已生效。

### 10.3 订阅更新、切换或重新导入

自定义内容放在订阅扩展中维护。更新后核对最终生成配置；切换、重新导入或重装后重新检查扩展关联和端口。原订阅的扩展文件存在，不代表新订阅已经使用它。

### 10.4 客户端或内核升级

复核版本、合并顺序及最终 `dns` 内容。若后续出现 `fake-ip-filter-mode`、`direct-nameserver` 等额外设置，需要检查它们与既有策略的关系，不能机械叠加示例。特别是配置 `direct-nameserver` 后，应检查是否通过 `direct-nameserver-follow-policy` 跟随域名策略。[Mihomo DNS 配置](https://wiki.metacubex.one/config/dns/)

当前保存的 DNS 配置包含 `respect-rules: true`。若将来改变路由规则，DNS 请求自身的出站也应纳入检查，确认公司 DNS 没有被送往不合适的路径。

### 10.5 切换公司、家庭网络或 VPN

公司 DNS 和私网服务需要相应网络路径。离开公司网络后访问失败，先判断是否需要公司 VPN，再排查配置；不要为了使这些内网域名在家中“解析成功”而随意改为公共 DNS。

### 10.6 DNS 缓存与浏览器状态

在确认配置已正确保存、重载后，如仍怀疑 Mac DNS 缓存，可按需执行：

```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

这些是可选维护命令，本次没有执行。随后按需重新连接 Clash、重启浏览器并复验。浏览器若启用了自定义安全 DNS，应检查其实际解析路径是否影响内网域名。

### 10.7 hosts 只作为经确认的临时办法

若确需临时 hosts 映射，先确认当前 IP、保留原文件，并只添加所需条目。不要覆盖系统默认条目，不要随意二选一处理 `git.xf.io` 的历史 `.82/.83`，也不要照抄疑似拼错的 GitHub 域名。临时映射应记录原因与撤销条件，以免服务迁移后继续命中旧地址。

## 11. 备份与回滚

建议保留两份纯文本备份：本文件第 6.1 节的 DNS Merge，以及第 7.1 节的规则扩展。另记当前版本、订阅关联、端口和系统代理／TUN 状态；如还维护其他自定义策略，应一并备份原配置。

若下一次修改造成异常：

1. 在相同订阅的相同编辑入口恢复修改前的配置。
2. 只撤回本次新增内容，保留原有其他业务配置。
3. 保存并重载，确认最终生成文件恢复预期。
4. 再比较 DNS 查询、直连 curl、显式 Clash curl 和浏览器结果。
5. 若此前临时加过 hosts，再单独撤销相应临时条目。

**本次文档生成没有实施上述维护或回滚操作。**

## 12. 维护记录模板

以后调整时，可在本文件末尾追加一份记录：

```text
变更日期与时区：
Clash Verge / 内核版本：
网络环境（公司 / 家庭 / VPN）：
当前订阅及扩展关联：
修改原因：
涉及域名：
公司 DNS：
DNS Merge 变更：
DIRECT 规则变更：
系统代理 / TUN / 代理端口：
DNS 查询结果：
直连 curl 结果：
显式 Clash curl 结果：
Clash 规则命中与出站：
浏览器及业务功能验证：
备份位置与回滚方法：
遗留问题：
```

## 13. 资料来源与核对范围

- 原对话：[访问页面状态](chatgpt-conversation://6ae46b25-31dc-83e9-ada1-a7c50246c90b)。本次恢复了用户提供的 hosts 清单、`scutil --dns` 输出、Merge 编辑截图及“可以访问了”的反馈；助手总结正文未完整恢复。
- 本次只读核对：Clash Verge 应用版本、当前订阅关联、DNS Merge、规则扩展、生成配置相关字段、应用开关及 `/etc/hosts` 中相关域名条目。
- [Clash Verge Rev：扩展配置与脚本](https://www.clashverge.dev/guide/extend.html)，用于说明编辑入口、版本差异和合并行为。
- [Mihomo：DNS 配置](https://wiki.metacubex.one/config/dns/)，用于核对 DNS 字段语义。
- [Mihomo：路由规则](https://wiki.metacubex.one/config/rules/)，用于核对规则顺序和匹配语义。
- [curl 官方手册](https://curl.se/docs/manpage.html)，用于核对验证命令参数。

本文件不包含订阅下载链接、代理节点凭据或任何登录信息。历史参考地址、实际保存配置和待执行验证命令已分别标注，后续维护请以当前网络实测结果为准。
