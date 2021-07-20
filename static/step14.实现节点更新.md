# 一、实现思路

更新节点的操作如何实现？当 dom 初始化渲染完成之后，要备份旧的 fiber 节点对象。当更新节点时，又一次调用了 render 方法，创建 fiber 对象，在创建 fiber 节点对象时，需要先判断旧的 fiber 对象是否存在，如果存在，说明当前需要执行更新操作，就去创建执行更新操作的 fiber
节点对象。

## 实现步骤 1.html 增加更新节点调试代码

```javascript
// src/index.js
import React, { render, Component } from "./react";
const root = document.getElementById("root");
const jsx = (
  <div>
    <p>hello React</p>
    <p>hello Fiber</p>
  </div>
);

render(jsx, root);

setTimeout(() => {
  const jsx = (
    <div>
      <p>奥利给</p>
      <p>hello Fiber</p>
    </div>
  );
  render(jsx, root);
}, 2000);
```

## 实现步骤 2.更新 getFirstTask 方法——创建根节点 dom 对象时，添加 alternate 属性，存储备份的 fiber 对象

```javascript
const getFirstTask = () => {
  // 从任务队列中获取任务
  const task = taskQueue.pop();
  // 返回最外层节点的fiber对象
  return {
    props: task.props,
    stateNode: task.dom,
    tag: "host_root",
    effects: [],
    child: null,
    // 创建根节点dom对象时，添加alternate属性，存储备份的fiber对象
+   alternate: task.dom.__rootFiberContainer,
  };
};
```

## 实现步骤 3.更新 reconcileChildren 方法

在构建子节点的这个 reconcileChildren 方法中，先判断父节点是否有 alternate，如果有说明有备份节点（fiber.alternate.child 其实是 children 数组中第一个子节点的备份节点，fiber.alternate.child.sibling 就是 children 数组中其他子节点的备份节点），在 while 循环中就需要执行更新操作。

在 while 循环中，需要更新 alternate 存储的备份节点，比如第一次 element = arrifiedChildren[0]就是 children 数组中第一个子节点，而
创建 fiber 对象时，就需要将 effectTag 的值设置为“update”，并且存储 alternate 值，以方便后续对比，同时判断节点的类型是否相同

```javascript
const reconcileChildren = (fiber, children) => {
  // 1.children可能是对象也可能是数组。需要将children转换成数组
  const arrifiedChildren = arrified(children);
  // 2.拿到数组中的vdom，转成fiber
  let index = 0;
  let numberOfElements = arrifiedChildren.length;
  let element = null;
  let newFiber = null;
  let prevFiber = null;
+ let alternate = null;
  // 有alternate说明有备份节点，fiber.alternate.child其实是children数组中第一个子节点的备份节点
+ if (fiber.alternate && fiber.alternate.child) {
+   alternate = fiber.alternate.child;
+ }
// while第一次循环时，element = arrifiedChildren[0]就是children数组中第一个子节点，在循环中，需要更新alternate存储的备份节点
  while (index < numberOfElements) {
    element = arrifiedChildren[index];

+   if (element && alternate) {
+     // 更新
+     newFiber = {
+       type: element.type,
+       props: element.props,
+       tag: getTag(element),
+       effects: [],
+       effectTag: "update",
+       parent: fiber,
+       alternate,
+      };
+     if (element.type === alternate.type) {
+       // 类型相同
+       newFiber.stateNode = alternate.stateNode;
+     } else {
+       // 类型不同
+       newFiber.stateNode = createStateNode(newFiber);
+     }
+   }
+   if (element && !alternate) {
      newFiber = {
        type: element.type,
        props: element.props,
        tag: getTag(element),
        effects: [],
        effectTag: "placement",
        parent: fiber,
      };
      newFiber.stateNode = createStateNode(newFiber);
+   }

    // 为父级fiber添加子级fiber
    if (index == 0) {
      fiber.child = newFiber;
    } else {
      prevFiber.sibling = newFiber;
    }

    // 判断备份节点是否有兄弟节点
+   if (alternate && alternate.sibling) {
+     alternate = alternate.sibling;
+   } else {
+     alternate = null;
+   }

    prevFiber = newFiber;
    index++;
  }
};
```

## 实现步骤 4.更新 commitAllWork 方法

当前接收的参数 fiber 对象就是根节点的 fiber 对象，在这个 fiber 对象中找到真实的根节点 dom 对象（fiber.stateNode），
并向其添加了一个属性\_\_rootFiberContainer，value 值就是根节点 fiber 对象

```javascript
// 执行fiber第二阶段的方法
const commitAllWork = (fiber) => {
  // 循环effects数组构建dom节点树
  fiber.effects.forEach((item) => {
+   if (item.effectTag === "update") {
+     // 更新
+     if (item.type === item.alternate.type) {
+       // 节点类型相同
+       updateNodeElement(item.stateNode, item, item.alternate);
+     } else {
+       // 节点类型不同
+       item.parent.stateNode.replaceChild(
+         item.stateNode,
+         item.alternate.stateNode
+       );
+     }
    } else if (item.effectTag === "placement") {
      // 类组件本身也是一个节点，但是不能追加dom元素，需要找到类组件的父级，这个父级一定是一个普通的dom元素，向其追加类组件返回的类型
      let fiber = item;
      let parentFiber = item.parent;
      while (
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
  // 备份旧的fiber节点对象-当前的fiber对象就是根节点fiber对象，在根节点fiber对象中找到真实的根节点dom对象（fiber.stateNode），
  // 向其添加一个属性__rootFiberContainer，value值就是根节点fiber对象
+ fiber.stateNode.__rootFiberContainer = fiber;
};
```

## 实现步骤 5.更新 updateNodeElement 方法——更新节点是文本节点时，就创建新的文本节点，替换旧的文本节点

```javascript
export default function updateNodeElement(
  newElement,
  virtualDOM,
  oldVirtualDOM = {}
) {
  // 获取节点对应的属性对象
  const newProps = virtualDOM.props || {};
  const oldProps = oldVirtualDOM.props || {};

+ if (virtualDOM.type === "text") {
+   if (newProps.textContent !== oldProps.textContent) {
+     virtualDOM.parent.stateNode.replaceChild(
+       document.createTextNode(newProps.textContent),
+       oldVirtualDOM.stateNode
+     );
+   }
+   return;
+ }

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

# 二、完整的 reconciliation/index.js 代码

```javascript
import { createTaskQueue, arrified, createStateNode, getTag } from "../Misc";
import { updateNodeElement } from "../DOM";
const taskQueue = createTaskQueue();
// 默认没有任务
let subTask = null;
let pendingCommit = null;

// 执行fiber第二阶段的方法
const commitAllWork = (fiber) => {
  // 循环effects数组构建dom节点树
  fiber.effects.forEach((item) => {
    if (item.effectTag === "update") {
      // 更新
      if (item.type === item.alternate.type) {
        // 节点类型相同
        updateNodeElement(item.stateNode, item, item.alternate);
      } else {
        // 节点类型不同
        item.parent.stateNode.replaceChild(
          item.stateNode,
          item.alternate.stateNode
        );
      }
    } else if (item.effectTag === "placement") {
      // 类组件本身也是一个节点，但是不能追加dom元素，需要找到类组件的父级，这个父级一定是一个普通的dom元素，向其追加类组件返回的类型
      let fiber = item;
      let parentFiber = item.parent;
      while (
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
  // 备份旧的fiber节点对象-当前的fiber对象就是根节点fiber对象，在根节点fiber对象中找到真实的根节点dom对象（fiber.stateNode），
  // 向其添加一个属性__rootFiberContainer，value值就是根节点fiber对象
  fiber.stateNode.__rootFiberContainer = fiber;
};
const getFirstTask = () => {
  // 从任务队列中获取任务
  const task = taskQueue.pop();
  // 返回最外层节点的fiber对象
  return {
    props: task.props,
    stateNode: task.dom,
    tag: "host_root",
    effects: [],
    child: null,
    // 创建根节点dom对象时，添加alternate属性，存储备份的fiber对象
    alternate: task.dom.__rootFiberContainer,
  };
};
const reconcileChildren = (fiber, children) => {
  // 1.children可能是对象也可能是数组。需要将children转换成数组
  const arrifiedChildren = arrified(children);
  // 2.拿到数组中的vdom，转成fiber
  let index = 0;
  let numberOfElements = arrifiedChildren.length;
  let element = null;
  let newFiber = null;
  let prevFiber = null;
  let alternate = null;

  if (fiber.alternate && fiber.alternate.child) {
    alternate = fiber.alternate.child;
  }
  while (index < numberOfElements) {
    element = arrifiedChildren[index];

    if (element && alternate) {
      // 更新
      newFiber = {
        type: element.type,
        props: element.props,
        tag: getTag(element),
        effects: [],
        effectTag: "update",
        parent: fiber,
        alternate,
      };
      if (element.type === alternate.type) {
        // 类型相同
        newFiber.stateNode = alternate.stateNode;
      } else {
        // 类型不同
        newFiber.stateNode = createStateNode(newFiber);
      }
    }
    if (element && !alternate) {
      newFiber = {
        type: element.type,
        props: element.props,
        tag: getTag(element),
        effects: [],
        effectTag: "placement",
        parent: fiber,
      };
      newFiber.stateNode = createStateNode(newFiber);
    }

    // 为父级fiber添加子级fiber
    if (index == 0) {
      fiber.child = newFiber;
    } else {
      prevFiber.sibling = newFiber;
    }

    if (alternate && alternate.sibling) {
      alternate = alternate.sibling;
    } else {
      alternate = null;
    }

    prevFiber = newFiber;
    index++;
  }
};
const executeTask = (fiber) => {
  if (fiber.tag === "class_component") {
    // fiber.stateNode组件的实例对象，可以调用render方法，获取到组件的子级
    reconcileChildren(fiber, fiber.stateNode.render());
  } else if (fiber.tag === "function_component") {
    reconcileChildren(fiber, fiber.stateNode(fiber.props));
  } else {
    reconcileChildren(fiber, fiber.props.children);
  }

  // 如果有子级，就返回子级，将这个子级当作父级，构建这个父级下的子级
  if (fiber.child) {
    return fiber.child;
  }

  let currentExecutelyFiber = fiber;

  // 没有子级，就判断是否有同级，有同级直接返回同级，没有同级就退到其父级，判断父级是否有同级
  while (currentExecutelyFiber.parent) {
    currentExecutelyFiber.parent.effects =
      currentExecutelyFiber.parent.effects.concat(
        currentExecutelyFiber.effects.concat([currentExecutelyFiber])
      );
    if (currentExecutelyFiber.sibling) {
      return currentExecutelyFiber.sibling;
    }
    currentExecutelyFiber = currentExecutelyFiber.parent;
  }

  pendingCommit = currentExecutelyFiber;
};
const workLoop = (deadline) => {
  // 1.先判断任务是否存在，如果不存在，则调用getFirstTask获取任务
  if (!subTask) {
    subTask = getFirstTask();
  }

  // 2.如果任务存在并且浏览器空余时间，则调用executeTask执行任务subTask
  // executeTask会返回一个新的任务
  while (subTask && deadline.timeRemaining() > 1) {
    subTask = executeTask(subTask);
  }

  if (pendingCommit) {
    commitAllWork(pendingCommit);
  }
};
// performTask函数通过形参获得浏览器的空闲时间
// 此方法不负责执行任务，只负责调度任务
const performTask = (deadline) => {
  // 执行任务
  workLoop(deadline);
  // 如果任务在执行过程中有更高优先级的任务要处理，那么这个任务就会被打断，任务打断，workLoop方法就会退出，就会执行本行下面的逻辑

  // 判断subTask任务是否有值
  // 判断任务队列中是否还有任务没有执行
  // 再次告诉浏览器在空闲的时间执行任务
  if (subTask || taskQueue.isEmpty()) {
    requestIdleCallback(performTask);
  }
};
// dom是父级
export const render = (element, dom) => {
  // 1.向任务队列中添加任务
  // 2.指定在浏览器空闲时执行任务
  // 任务就是通过vdom对象构建fiber对象
  taskQueue.push({
    dom,
    props: { children: element },
  });
  // 当浏览器空闲时就会调用performTask
  requestIdleCallback(performTask);
};
```
