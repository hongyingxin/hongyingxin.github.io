# Mac + Cursor Flutter 环境配置入门

本文既是一篇面向前端开发者的 Flutter 环境配置教材，也记录了我在 macOS 上实际搭建 Flutter 开发环境时遇到的问题和解决过程。

完成本文后，可以在同一台 Mac 上使用 Cursor 编写 Flutter 项目，并分别运行到 iOS 模拟器、Android 模拟器、Chrome 和 macOS 桌面端。

## 1. 需求与环境背景

### 1.1 配置目标

本次需要完成以下内容：

- 安装 Flutter SDK 和内置的 Dart SDK
- 使用 Cursor 作为主要编辑器
- 配置 Xcode 和 iOS Simulator
- 配置 Android Studio、Android SDK 和 Android Emulator
- 使用 `flutter doctor` 检查并逐项修复环境问题
- 创建并运行第一个 Flutter 项目
- 整理常用的设备、运行和调试命令

### 1.2 本次使用的环境

```text
系统：macOS
处理器：Apple Silicon（arm64）
编辑器：Cursor
Flutter：3.44.6 stable
开发目标：iOS、Android、Web、macOS
```

如果不确定 Mac 的处理器架构，可以执行：

```bash
uname -m
```

输出 `arm64` 代表 Apple Silicon，应下载 Flutter 的 `arm64` 版本；输出 `x86_64` 则代表 Intel Mac。

### 1.3 前端开发者概念对照

| Web 前端 | Flutter |
| --- | --- |
| Node.js | Flutter SDK |
| JavaScript / TypeScript | Dart |
| npm / pnpm | pub |
| `package.json` | `pubspec.yaml` |
| `pnpm install` | `flutter pub get` |
| `pnpm run dev` | `flutter run` |
| 浏览器 | 模拟器、真机、桌面或浏览器 |
| HMR | Hot Reload |

Flutter 项目不是固定启动一个开发服务器，而是先选择运行设备，再把应用编译并安装到该设备。

## 2. 安装 Flutter SDK

### 2.1 踩坑记录：Homebrew 下载过慢

最初使用 Homebrew 安装：

```bash
brew install flutter
```

Flutter SDK 的安装包超过 2 GB。在当前网络环境下，Homebrew 长时间停留在类似进度：

```text
Downloading 49.8MB / 2.2G
```

安装中途取消后，执行下面的命令可能提示 Flutter 尚未安装：

```bash
brew uninstall flutter
```

```text
Error: Cask 'flutter' is not installed.
```

这是正常现象，说明下载尚未完成，Homebrew 没有把它登记为已安装软件，不需要反复卸载。

> `PUB_HOSTED_URL` 和 `FLUTTER_STORAGE_BASE_URL` 主要影响 Flutter 依赖及产物下载，并不能直接加速 Homebrew Cask 下载 Flutter SDK 本体。

因此，本次最终改用手动安装。

### 2.2 手动下载正确版本

从 Flutter 官方安装页面下载与 Mac 架构对应的 stable 压缩包。本次下载的是：

```text
flutter_macos_arm64_3.44.6-stable.zip
```

建议把 SDK 长期放在固定开发目录，不要一直放在“下载”或“桌面”目录。

创建目录：

```bash
mkdir -p ~/development
```

假设压缩包位于 `~/Downloads`，执行：

```bash
cd ~/Downloads
unzip flutter_macos_arm64_3.44.6-stable.zip -d ~/development
```

最终应存在：

```text
~/development/flutter/bin/flutter
```

### 2.3 配置 PATH

把 Flutter 命令加入 zsh 的 PATH：

```bash
echo 'export PATH="$HOME/development/flutter/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

验证安装：

```bash
flutter --version
```

正常情况下会显示 Flutter、channel 和 Dart 版本，例如：

```text
Flutter 3.44.6 • channel stable
Dart 3.12.2
```

如果出现：

```text
zsh: command not found: flutter
```

依次确认：

```bash
ls ~/development/flutter/bin/flutter
grep 'development/flutter/bin' ~/.zshrc
source ~/.zshrc
```

如果 `.zshrc` 中重复添加了多行相同 PATH，只保留一行即可。

## 3. 配置 Cursor

Cursor 基于 VS Code，可以直接使用 Dart Code 提供的扩展。

在扩展市场安装以下两个扩展：

1. `Dart`，发布者为 `Dart-Code`
2. `Flutter`，发布者为 `Dart-Code`

安装后重启 Cursor，按 `Command + Shift + P` 打开命令面板，搜索：

```text
Flutter: New Project
```

能看到该命令，说明扩展已经正常加载。

代码片段、Riverpod、国际化等扩展不是环境必需项，入门阶段可以暂不安装。

## 4. 使用 flutter doctor 检查环境

Flutter 最重要的环境诊断命令是：

```bash
flutter doctor
```

需要更详细的信息时执行：

```bash
flutter doctor -v
```

第一次运行可能需要初始化缓存或访问网络，因此会比之后慢。最初常见结果如下：

```text
[✓] Flutter
[✗] Android toolchain
[!] Xcode
[✓] Chrome
[✓] Connected device
```

不需要一次解决所有问题。按照输出提示，依次配置 iOS 和 Android 工具链即可。

最终目标类似：

```text
[✓] Flutter
[✓] Android toolchain
[✓] Xcode
[✓] Chrome
[✓] Connected device
```

## 5. 配置 iOS 开发环境

### 5.1 安装并初始化 Xcode

从 Mac App Store 安装 Xcode。安装完成后先手动打开一次，让 Xcode 完成必要组件初始化。

然后在终端执行：

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch
```

重新检查：

```bash
flutter doctor
```

Xcode 一项应变为：

```text
[✓] Xcode
```

### 5.2 安装 CocoaPods

CocoaPods 用于管理 Flutter 项目中的 iOS 原生依赖。

可以通过 Homebrew 安装：

```bash
brew install cocoapods
```

也可以通过 RubyGems 安装：

```bash
sudo gem install cocoapods
```

本次使用 RubyGems 时曾长时间没有输出，通常是访问软件源较慢。遇到类似情况可以先等待，确认没有进展后按 `Control + C` 终止，再选择 Homebrew 方案。

验证：

```bash
pod --version
flutter doctor
```

> CocoaPods 和 npm 的角色有些相似，但它服务于 iOS 原生依赖，并不是 Flutter 项目中 `flutter pub get` 的替代品。

## 6. 配置 Android 开发环境

### 6.1 安装 Android Studio

从 Android Studio 官方网站下载 Mac 版本。Apple Silicon 机器选择 Apple chip 版本。

首次启动时使用 Standard 配置即可。Android Studio 在本套环境中主要负责：

- Android SDK
- SDK Platform 和构建工具
- Android Emulator
- 虚拟设备管理

日常 Dart 和 Flutter 代码仍然可以在 Cursor 中编写。

### 6.2 安装 Android SDK 工具

在 Android Studio 欢迎页进入：

```text
More Actions → SDK Manager → SDK Tools
```

如果已经打开项目，也可以从设置中的 Android SDK 页面进入。

至少确认以下工具已安装：

- Android SDK Command-line Tools（latest）
- Android SDK Platform-Tools
- Android SDK Build-Tools
- Android Emulator

NDK（Side by side）和 CMake 通常可按项目需要安装；本次项目在 Android 构建阶段使用了 NDK，因此也安装了它们。

如果 Flutter 仍找不到 Android SDK，先在 SDK Manager 顶部确认 SDK 路径。macOS 的默认路径通常是：

```text
~/Library/Android/sdk
```

必要时显式告诉 Flutter：

```bash
flutter config --android-sdk "$HOME/Library/Android/sdk"
```

### 6.3 接受 Android SDK 许可证

如果 `flutter doctor` 提示：

```text
Some Android licenses not accepted.
```

执行：

```bash
flutter doctor --android-licenses
```

这条命令会逐项展示 Android SDK 的使用协议。阅读后，在同意的前提下输入 `y` 并回车，直到看到：

```text
All SDK package licenses accepted
```

它只是在处理 Android SDK 许可证，不会修改 Flutter 项目代码。

## 7. flutter doctor 问题排查记录

### 7.1 `cmdline-tools component is missing`

报错说明 Android SDK Command-line Tools 尚未安装。

解决路径：

```text
Android Studio
→ More Actions
→ SDK Manager
→ SDK Tools
→ Android SDK Command-line Tools (latest)
→ Apply
```

安装完成后执行：

```bash
flutter doctor
```

### 7.2 Android licenses 未接受

报错：

```text
Some Android licenses not accepted.
```

解决：

```bash
flutter doctor --android-licenses
flutter doctor
```

### 7.3 CocoaPods 未安装或安装卡住

`flutter doctor` 可能提示：

```text
CocoaPods not installed
```

如果 `sudo gem install cocoapods` 长时间没有进展，可以终止后改用：

```bash
brew install cocoapods
pod --version
```

### 7.4 Flutter 尝试连接 GitHub 时很慢

第一次执行 `flutter doctor` 时可能出现：

```text
Attempting to reach github.com...
```

这通常是网络检查，不代表 SDK 安装失败。可以先检查网络，稍后重试：

```bash
flutter doctor -v
```

不要把网络等待误判为 Xcode、Android Studio 或 Cursor 配置错误。

### 7.5 Android NDK 缺少 `source.properties`

本次首次运行 Android 时遇到：

```text
[CXX1101] NDK at .../ndk/28.2.13676358 did not have a source.properties file
```

这表示对应 NDK 版本下载不完整或目录损坏。

先查看已安装版本：

```bash
ls "$HOME/Library/Android/sdk/ndk"
```

再确认报错目录确实缺少文件：

```bash
ls "$HOME/Library/Android/sdk/ndk/28.2.13676358/source.properties"
```

确认该明确版本目录损坏后，再删除它：

```bash
rm -rf "$HOME/Library/Android/sdk/ndk/28.2.13676358"
```

然后进入 Android Studio：

```text
SDK Manager → SDK Tools
```

重新安装：

- NDK（Side by side）
- CMake

回到 Flutter 项目，清理并重新构建：

```bash
flutter clean
flutter pub get
flutter run -d emulator-5554
```

> 删除前必须以实际报错中的完整版本号为准，不要删除整个 `ndk` 目录，也不要照抄一个与本机无关的版本号。

## 8. 创建第一个 Flutter 项目

创建项目：

```bash
flutter create flutter_demo
cd flutter_demo
```

使用 Cursor 打开：

```bash
cursor .
```

Flutter 项目的默认入口是：

```text
lib/main.dart
```

安装或恢复 Dart 依赖：

```bash
flutter pub get
```

直接运行：

```bash
flutter run
```

如果只有一个合适的移动设备正在运行，Flutter 通常会直接选择它；如果有多个可用设备，可能提示选择，也可以使用 `-d` 主动指定设备。

## 9. 启动和管理模拟器

### 9.1 理解 `devices` 和 `emulators`

```bash
flutter devices
```

显示当前已经启动或已经连接、能够立即运行 Flutter 应用的设备，例如：

- iOS Simulator
- Android Emulator
- Android 或 iPhone 真机
- macOS
- Chrome

模拟器已经创建但尚未启动时，通常不会出现在 `flutter devices` 中。

查看已经配置的模拟器：

```bash
flutter emulators
```

### 9.2 启动 iOS 模拟器

启动 Simulator：

```bash
open -a Simulator
```

等待 iPhone 完成开机，再查看设备：

```bash
flutter devices
```

指定 iPhone 设备名运行：

```bash
flutter run -d "iPhone 17"
```

设备名称中有空格，因此要使用引号。也可以复制 `flutter devices` 输出中的设备 ID：

```bash
flutter run -d <iOS设备ID>
```

### 9.3 创建和启动 Android 模拟器

在 Android Studio 中进入：

```text
Device Manager → Create Virtual Device
```

选择设备型号和系统镜像，创建完成后点击启动按钮。

也可以先查看 Flutter 已识别的模拟器：

```bash
flutter emulators
```

通过模拟器 ID 启动：

```bash
flutter emulators --launch <emulator_id>
```

启动完成后：

```bash
flutter devices
```

Android 设备名称可能类似：

```text
sdk gphone16k arm64 (mobile) • emulator-5554
```

推荐使用稳定且不含空格的设备 ID：

```bash
flutter run -d emulator-5554
```

如果使用完整名称，必须加引号：

```bash
flutter run -d "sdk gphone16k arm64"
```

### 9.4 同时运行 iOS 和 Android

先同时启动两个模拟器，再打开两个终端。

终端一：

```bash
flutter run -d "iPhone 17"
```

终端二：

```bash
flutter run -d emulator-5554
```

每个 `flutter run` 进程分别连接一个设备，因此可以同时观察同一套 Flutter 代码在 iOS 和 Android 上的效果。

在 Cursor 中也可以点击底部状态栏的设备名称切换目标设备，然后按 `F5` 启动调试。

## 10. flutter run 与设备命令速查

### 10.1 环境检查

| 命令 | 作用 |
| --- | --- |
| `flutter --version` | 查看 Flutter 和 Dart 版本 |
| `flutter doctor` | 检查开发环境 |
| `flutter doctor -v` | 查看详细诊断信息 |
| `flutter doctor --android-licenses` | 检查并接受 Android SDK 许可证 |

### 10.2 项目与依赖

| 命令 | 作用 |
| --- | --- |
| `flutter create demo` | 创建名为 `demo` 的项目 |
| `flutter pub get` | 安装或恢复项目依赖 |
| `flutter clean` | 清理构建产物 |
| `flutter upgrade` | 升级 Flutter SDK |

初学阶段不需要因为出现版本更新提示就立即执行 `flutter upgrade`，项目能稳定运行时可以先保持当前 stable 版本。

### 10.3 设备与模拟器

| 命令 | 作用 |
| --- | --- |
| `flutter devices` | 查看当前可运行的设备 |
| `flutter emulators` | 查看已配置的模拟器 |
| `flutter emulators --launch <id>` | 启动指定模拟器 |
| `open -a Simulator` | 启动 iOS Simulator |

### 10.4 运行项目

| 命令 | 作用 |
| --- | --- |
| `flutter run` | 运行项目，自动选择或提示选择设备 |
| `flutter run -d <id>` | 在指定设备运行 |
| `flutter run -d chrome` | 运行 Web 版本 |
| `flutter run -d macos` | 运行 macOS 桌面版本 |
| `flutter run -d emulator-5554` | 运行到指定 Android 模拟器 |
| `flutter run -d "iPhone 17"` | 运行到指定 iOS 模拟器 |

设备 ID 以本机 `flutter devices` 的实际输出为准。

### 10.5 `flutter run` 运行期间的快捷键

| 按键 | 作用 |
| --- | --- |
| `r` | Hot Reload，保留大部分运行状态并更新界面 |
| `R` | Hot Restart，重新启动 Dart 应用 |
| `h` | 显示帮助和所有可用命令 |
| `q` | 停止运行并退出 |

Hot Reload 类似前端开发中的 HMR。修改 `lib/main.dart` 并保存后，可以在运行 Flutter 的终端按 `r` 查看更新。

## 11. 最终检查清单

- [ ] `flutter --version` 能正常显示版本
- [ ] Cursor 已安装 Dart 和 Flutter 官方扩展
- [ ] `flutter doctor` 中 Flutter、Xcode 和 Android toolchain 均通过
- [ ] `pod --version` 能正常显示版本
- [ ] `flutter doctor --android-licenses` 已完成
- [ ] iOS Simulator 能出现在 `flutter devices` 中
- [ ] Android Emulator 能出现在 `flutter devices` 中
- [ ] `flutter run -d "<iOS设备>"` 能成功运行
- [ ] `flutter run -d <Android设备ID>` 能成功运行
- [ ] 修改代码后可以使用 Hot Reload

完成以上检查后，Mac + Cursor 的 Flutter 多端开发环境就配置完成了。
