# 一、步骤概述

1、首先在 src/index.js 文件中声明一个函数组件，并调用 render 方法。

2、函数组件所对应的 fiber 对象处理：在 step12 中，已经对 getTag 和 createStateNode 方法中进行了逻辑补充（包括对于函数组件的处理），本节就不需要在补充了。

3、在 executeTask 方法中，调用了 reconcileChildren 方法，其中第二个参数是子元素，普通节点的子元素通过 fiber.props.children 获取，类组件的子元素需要通过 fiber.stateNode.render()获取，而函数组件的子元素需要通过 fiber.stateNode(fiber.props)获取：fiber.stateNode 本身存储的就是一个函数组件本身，调用这个函数，并传递 props，返回的就是组件节点本身的子节点。

4、在提交 commit 阶段，函数组件的处理跟类组件一样，无法直接追加节点，找到它的普通节点父级。

# 二、代码更新

## 1、src/index.js 文件中声明一个函数组件，并调用 render 方法

```javascript
import React, { render, Component } from "./react";
const root = document.getElementById("root");

function FnComponent(props) {
  return <div>{props.title},FnComponent</div>;
}
render(<FnComponent title="hello" />, root);
```

## 2、更新 executeTask 方法，调用 reconcileChildren 方法时，如果是函数组件第二个参数传 fiber.stateNode(fiber.props)

```javascript
const executeTask = (fiber) => {
  if (fiber.tag === "class_component") {
    // fiber.stateNode组件的实例对象，可以调用render方法，获取到组件的子级
    reconcileChildren(fiber, fiber.stateNode.render());
  } else if (fiber.tag === "function_component") {
    reconcileChildren(fiber, fiber.stateNode(fiber.props));
  } else {
    reconcileChildren(fiber, fiber.props.children);
  }
};
```

## 3、更新 commitAllWork 方法-提交 commit 阶段，判断当前组件的父级是否是类组件或函数组件，如果是就需要找到它的普通节点父级，向其追加元素

```javascript
const commitAllWork = (fiber) => {
  fiber.effects.forEach((item) => {
    if (item.effectTag === "placement") {
      // 类组件本身也是一个节点，但是不能追加dom元素，需要找到类组件的父级，这个父级一定是一个普通的dom元素，向其追加类组件返回的类型
      //
      let fiber = item;
      let parentFiber = item.parent;
+     while (
        parentFiber.tag === "class_component" ||
        parentFiber.tag === "function_component"
      ) {
        parentFiber = parentFiber.parent;
      }
      if (fiber.tag === "host_component") {
        parentFiber.stateNode.appendChild(item.stateNode);
      }
    }
  });
};
```
