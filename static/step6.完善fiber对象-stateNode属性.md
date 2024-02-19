# 一、概述

fiber 对象中的属性 stateNode，取决于当前节点的类型，如果当前节点是一个普通节点，stateNode 就存储当前节点的 dom 对象，如果是组件，stateNode 就存储组件所对应的实例对象。

# 二、更新代码

```javascript
// reconciliation/index.js
- import { createTaskQueue, arrified } from "../Misc";
+ import { createTaskQueue, arrified, createStateNode } from "../Misc";
...
const reconcileChildren = (fiber, children) => {
  ...
  while (index < numberOfElements) {
    element = arrifiedChildren[index];
    newFiber = {
      type: element.type,
      props: element.props,
      tag: "host_component",
      effects: [],
      effectTag: "placement",
-     stateNode: null,
      parent: fiber,
    };

+   newFiber.stateNode = createStateNode(newFiber);
    // 为父级fiber添加子级fiber
    if (index == 0) {
      fiber.child = newFiber;
    } else {
      prevFiber.sibling = newFiber;
    }
    prevFiber = newFiber;
    index++;
  }
};
```

```javascript
// 新建src/react/Misc/createStateNode/index.js
import { createDOMElement } from "../../DOM";
const createStateNode = (fiber) => {
  // 是普通节点，则调用createDOMElement创建这个普通节点
  if (fiber.tag === "host_component") {
    return createDOMElement(fiber);
  }
};
export default createStateNode;
```

```javascript
// 复制或创建react/DOM/createDOMElement.js
// import mountElement from "./mountElement"
import updateNodeElement from "./updateNodeElement";

export default function createDOMElement(virtualDOM) {
  let newElement = null;
  if (virtualDOM.type === "text") {
    // 文本节点
    newElement = document.createTextNode(virtualDOM.props.textContent);
  } else {
    // 元素节点
    newElement = document.createElement(virtualDOM.type);
    updateNodeElement(newElement, virtualDOM);
  }

  //   newElement._virtualDOM = virtualDOM

  //   // 递归创建子节点
  //   virtualDOM.children.forEach(child => {
  //     mountElement(child, newElement)
  //   })

  //   if (virtualDOM.props && virtualDOM.props.ref) {
  //     virtualDOM.props.ref(newElement)
  //   }

  return newElement;
}
```

```javascript
// 复制或创建react/DOM/updateNodeElement.js
export default function updateNodeElement(
  newElement,
  virtualDOM,
  oldVirtualDOM = {}
) {
  // 获取节点对应的属性对象
  const newProps = virtualDOM.props || {};
  const oldProps = oldVirtualDOM.props || {};
  Object.keys(newProps).forEach((propName) => {
    // 获取属性值
    const newPropsValue = newProps[propName];
    const oldPropsValue = oldProps[propName];
    if (newPropsValue !== oldPropsValue) {
      // 判断属性是否是否事件属性 onClick -> click
      if (propName.slice(0, 2) === "on") {
        // 事件名称
        const eventName = propName.toLowerCase().slice(2);
        // 为元素添加事件
        newElement.addEventListener(eventName, newPropsValue);
        // 删除原有的事件的事件处理函数
        if (oldPropsValue) {
          newElement.removeEventListener(eventName, oldPropsValue);
        }
      } else if (propName === "value" || propName === "checked") {
        newElement[propName] = newPropsValue;
      } else if (propName !== "children") {
        if (propName === "className") {
          newElement.setAttribute("class", newPropsValue);
        } else {
          newElement.setAttribute(propName, newPropsValue);
        }
      }
    }
  });
  // 判断属性被删除的情况
  Object.keys(oldProps).forEach((propName) => {
    const newPropsValue = newProps[propName];
    const oldPropsValue = oldProps[propName];
    if (!newPropsValue) {
      // 属性被删除了
      if (propName.slice(0, 2) === "on") {
        const eventName = propName.toLowerCase().slice(2);
        newElement.removeEventListener(eventName, oldPropsValue);
      } else if (propName !== "children") {
        newElement.removeAttribute(propName);
      }
    }
  });
}
```
