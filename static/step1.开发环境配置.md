### 1. 开发环境配置

#### 1.1 文件夹结构

| 文件 / 文件夹            | 描述                    |
| ------------------------ | ----------------------- |
| src                      | 存储源文件              |
| dist                     | 存储客户端代码打包文件  |
| build                    | 存储服务端代码打包文件  |
| server.js                | 存储服务器端代码        |
| webpack.config.server.js | 服务端 webpack 配置文件 |
| webpack.config.client.js | 客户端 webpack 配置文件 |
| babel.config.json        | babel 配置文件          |
| package.json             | 项目工程文件            |

创建 package.json 文件：`npm init -y`

#### 1.2 安装项目依赖

开发依赖：`npm install webpack webpack-cli webpack-node-externals @babel/core @babel/preset-env @babel/preset-react babel-loader nodemon npm-run-all -D`

项目依赖：`npm install express`

| 依赖项                 | 描述                                               |
| ---------------------- | -------------------------------------------------- |
| webpack                | 模块打包工具                                       |
| webpack-cli            | 打包命令                                           |
| webpack-node-externals | 打包服务器端模块时剔除 node_modules 文件夹中的模块 |
| @babel/core            | JavaScript 代码转换工具                            |
| @babel/preset-env      | babel 预置，转换高级 JavaScript 语法               |
| @babel/preset-react    | babel 预置，转换 JSX 语法                          |
| babel-loader           | webpack 中的 babel 工具加载器                      |
| nodemon                | 监控服务端文件变化，重启应用                       |
| npm-run-all            | 命令行工具，可以同时执行多个命令                   |
| express                | 基于 node 平台的 web 开发框架                      |

#### 1.3 环境配置

##### 1.3.1 创建 web 服务器

```javascript
// server.js
import express from "express";
const app = express();
app.use(express.static("dist"));
const template = `
  <html>
    <head>
      <title>React Fiber</title>
    </head>
    <body>
      <div id="root"></div>
			<script src="bundle.js"></script>
    </body>
  </html>
`;
app.get("*", (req, res) => {
  res.send(template);
});
app.listen(2000, () => console.log("server is running"));
```

##### 1.3.2 服务端 webpack 配置

```javascript
// webpack.config.server.js
const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  target: "node",
  mode: "development",
  entry: "./server.js",
  output: {
    filename: "server.js",
    path: path.resolve(__dirname, "build"),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
  externals: [nodeExternals()],
};
```

##### 1.3.3 babel 配置

```javascript
{
  "presets": ["@babel/preset-env", "@babel/preset-react"]
}
```

##### 1.3.4 客户端 webpack 配置

```javascript
const path = require("path");

module.exports = {
  target: "web",
  mode: "development",
  entry: "./src/index.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
};
```

##### 1.3.5 启动命令

```json
"scripts": {
  "start": "npm-run-all --parallel dev:*",
  "dev:server-compile": "webpack --config webpack.config.server.js --watch",
  "dev:server": "nodemon ./build/server.js",
  "dev:client-compile": "webpack --config webpack.config.client.js --watch"
},
```
