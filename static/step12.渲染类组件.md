# 一、步骤概述

首先在 src/index.js 文件中声明一个类组件，并调用 render 方法。

在构建子节点方法 reconcileChildren 中，创建 fiber 对象时，如果是类组件的话，对象的 tag 属性值就是“class_component”，stateNode 属性中存储的就是该组件的实例对象。因此需要去 getTag 和 createStateNode 方法中进行逻辑补充。

在 executeTask 方法中，调用了 reconcileChildren 方法，其中第二个参数是子元素，普通节点的子元素通过 fiber.props.children 获取，而类组件的子元素需要通过 fiber.stateNode.render()获取：fiber.stateNode 存储了组件的实例对象，可以调用 render 方法，获取到组件的子级。

在提交 commit 阶段，需要判断当前组件的父级是否是类组件，如果是类组件，就无法直接向其追加节点，需要查找父级的父级，直到查找到的父级不是类组件为止，即找到它的普通节点父级为止。

# 二、代码更新

## 1、src/index.js 文件中声明一个类组件，并调用 render 方法

```javascript
import React, { render, Component } from "./react";
const root = document.getElementById("root");

class Greating extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return <div>hhhhhh</div>;
  }
}

render(<Greating />, root);
```

## 2、补充 getTag 方法逻辑-如果是类组件，返回"class_component"

```javascript
import { Component } from "../../Component";
const getTag = (vdom) => {
  // type值示例： type: "div"
  if (typeof vdom.type === "string") {
    return "host_component";
+ } else if (Object.getPrototypeOf(vdom.type) === Component) {
+   return "class_component";
+ } else {
+   return "function_component";
  }
};
```

## 3、补充 createStateNode 方法逻辑-如果是类组件，返回组件的实例对象

```javascript
import { createReactInstance } from "../createReactInstance";
const createStateNode = (fiber) => {
  // 是普通节点，则调用createDOMElement创建这个普通节点
  if (fiber.tag === "host_component") {
    return createDOMElement(fiber);
  } else {
    return createReactInstance(fiber);
  }
};
```

## 4、更新 executeTask 方法，调用 reconcileChildren 方法时，如果是类组件第二个参数传 fiber.stateNode.render()

```javascript
const executeTask = (fiber) => {
+ if (fiber.tag === "class_component") {
+   // fiber.stateNode组件的实例对象，可以调用render方法，获取到组件的子级
+   reconcileChildren(fiber, fiber.stateNode.render());
+ } else {
    reconcileChildren(fiber, fiber.props.children);
+ }
}
```

## 5、更新 commitAllWork 方法-提交 commit 阶段，判断当前组件的父级是否是类组件，如果是类组件需要找到它的普通节点父级，向其追加元素

```javascript
const commitAllWork = (fiber) => {
  fiber.effects.forEach((item) => {
    if (item.effectTag === "placement") {
      // 类组件本身也是一个节点，但是不能追加dom元素，需要找到类组件的父级，这个父级一定是一个普通的dom元素，向其追加类组件返回的类型
      //
-     item.parent.stateNode.appendChild(item.stateNode);
+     let fiber = item;
+     let parentFiber = item.parent;
+     while (parentFiber.tag === "class_component") {
+       parentFiber = parentFiber.parent;
+     }
+     if (fiber.tag === "host_component") {
+       parentFiber.stateNode.appendChild(item.stateNode);
      }
    }
  });
};
```

# 6、createReactInstance 方法

```javascript
export const createReactInstance = (fiber) => {
  let instance = null;
  if (fiber.tag === "class_component") {
    instance = new fiber.type(fiber.props);
  } else {
    instance = fiber.type;
  }
  return instance;
};
```
