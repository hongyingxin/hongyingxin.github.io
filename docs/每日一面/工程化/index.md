# 工程化

## webpack 的构建流程

webpack 的主要原理是，它将所有的资源都看成是一个模块，并且把页面逻辑当作一个整体，通过一个给定的入口文件，webpack 从这个文件开始，找到所有的依赖文件，将各个依赖文件模块通过 loader 和 plugins 处理后，然后打包在一起，最后输出一个浏览器可识别的 JS 文件。

Webpack 具有四个核心的概念，分别是 Entry（入口）、Output（输出）、loader 和 Plugins（插件）。

1. Entry 是 webpack 的入口起点，它指示 webpack 应该从哪个模块开始着手，来作为其构建内部依赖的开始。

2. Output 属性告诉 webpack 在哪里输出它所创建的打包文件，也可指定打包文件的名称，默认位置为 ./dist。

3. loader 可以理解为 webpack 的编译器，它使得 webpack 可以处理一些非 JavaScript 文件。常用的 loader 有 css-loader、style-loader、scss-loader、babel-loader、eslint-loader 等。

4. 插件可以用于执行范围更广的任务，包括打包、优化、压缩、搭建服务器等等，要使用一个插件，一般是先使用 npm 包管理器进行安装，然后在配置文件中引入，最后将其实例化后传递给 plugins 数组属性。场景的插件有html-webpack-plugin 自动生成html模板、hot-module-relacement 模块热替换

## webpack 热更新原理

热更新的核心是客户端从服务端拉取更新后的文件，准确的说是chunk diff（即更新的部分）。在webpack-dev-server服务与浏览器之间维护了一个websocket。当本地资源发生变化就会向浏览器推送更新，并带上构建时的hash，让客户端与上一次资源对比较，客户端对比出差异后就会重新拉取资源文件。

webpack的热更新就是，当我们对代码做修改并保存后，webpack会对修改的代码块进行重新打包，并将新的模块发送至浏览器端，浏览器用新的模块代替旧的模块，从而实现了在不刷新浏览器的前提下更新页面。相比起直接刷新页面的方案，HMR的优点是可以保存应用的状态。当然，随着项目体积的增长，热更新的速度也会随之下降。
