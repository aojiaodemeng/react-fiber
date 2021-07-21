# 一、实现思路

当组件的状态更新时，要把更新操作当作一个任务放到任务队列里，并指定浏览器空闲时执行任务。在执行任务时，要将组件的状态更新任务与其他任务进行区分，所以在添加任务时，可以在任务对象中添加一个字符串标识，在任务对象中，还要添加组件的实例对象和即将要更新的组件状态对象，因为要从组件的实例对象中获取到原本的 state 对象，根据即将要更新的组件状态对象以及原本的 state 对象，才能更新 state 对象。

更新完 state 对象，如何将 state 对象中的数据更新到真实的 dom 对象中？要从根节点开始，为每一个节点重新构建 fiber 对象，从而创建出执行更新操作的 fiber 对象，在进行到 fiber 对象的第二个阶段时，就可以将更新应用到真实的 dom 对象中。

如何获取到已存在的根节点 fiber 对象？状态发生更改时，根节点 fiber 对象已经存在，根据这个已存在的根节点 fiber 对象构建新的根节点 fiber 对象，可以先将组件的 fiber 对象备份到实例对象上，因为组件更新时是可以获取到实例对象的，从而获取到组件的 fiber 对象，从而可以一层一层向上查找，最终获取到最外层的 fiber 对象。

## 1.html

```javascript
import React, { render, Component } from "./react";
const root = document.getElementById("root");
const jsx = (
  <div>
    <p>hello React</p>
    <p>hello Fiber</p>
  </div>
);

class Greating extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "张三",
    };
  }

  render() {
    return (
      <div>
        {this.props.title} hhh hhhh{this.state.name}
        <button onClick={() => this.setState({ name: "李四" })}>button</button>
      </div>
    );
  }
}

render(<Greating title="奥利给" />, root);
```

## 2.定义 setState 方法

```javascript
import { scheduleUpdate } from "../reconciliation";
export class Component {
  constructor(props) {
    this.props = props;
  }

+ setState(partialState) {
+   scheduleUpdate(this, partialState);
+ }

}
```

## 3.定义 getRoot 方法——从组件实例对象中获取 fiber 对象

```javascript
const getRoot = (instance) => {
  let fiber = instance.__fiber;
  while (fiber.parent) {
    fiber = fiber.parent;
  }
  return fiber;
};

export default getRoot;
```

## 4.定义 scheduleUpdate 方法——更新操作当作一个任务放到任务队列里，并指定浏览器空闲时执行任务

```javascript
// conciliation/index.js
export const scheduleUpdate = (instance, partialState) => {
  taskQueue.push({
    from: "class_component",
    instance,
    partialState,
  });
  requestIdleCallback(performTask);
};
```

## 5.getFirstTask

```javascript
const getFirstTask = () => {
  const task = taskQueue.pop();
+ if (task.from === "class_component") {
+   // 组件状态更新任务
+   // 获取到组件的实例对象，再获取到最外层节点的fiber对象
+   const root = getRoot(task.instance);
+   task.instance.__fiber.partialState = task.partialState;
+   return {
+     props: root.props,
+     stateNode: root.stateNode,
+     tag: "host_root",
+     effects: [],
+     child: null,
+     alternate: root,
+   };
+ }
}

```

## 6.executeTask 方法

```javascript
const executeTask = () => {
  if (fiber.tag === "class_component") {
+   if (fiber.stateNode.__fiber && fiber.stateNode.__fiber.partialState) {
+     fiber.stateNode.state = {
+       ...fiber.stateNode.state,
+       ...fiber.stateNode.__fiber.partialState,
+     };
+   }
    // fiber.stateNode组件的实例对象，可以调用render方法，获取到组件的子级
    reconcileChildren(fiber, fiber.stateNode.render());
  }
}

```

## 7.commitAllWork

```javascript
const commitAllWork = (fiber) => {
  fiber.effects.forEach((item) => {
    // 将组件的fiber对象添加到组件的实例对象上
+   if (item.tag === "class_component") {
+     item.stateNode.__fiber = item;
+   }
    ...
  });
};
```

# 完整的 conciliation/index.js

```javascript
import {
  createTaskQueue,
  arrified,
  createStateNode,
  getTag,
  getRoot,
} from "../Misc";
import { updateNodeElement } from "../DOM";
const taskQueue = createTaskQueue();
// 默认没有任务
let subTask = null;
let pendingCommit = null;

// 执行fiber第二阶段的方法
const commitAllWork = (fiber) => {
  // 循环effects数组构建dom节点树
  fiber.effects.forEach((item) => {
    // 将组件的fiber对象添加到组件的实例对象上
    if (item.tag === "class_component") {
      item.stateNode.__fiber = item;
    }
    if (item.effectTag === "delete") {
      item.parent.stateNode.removeChild(item.stateNode);
    } else if (item.effectTag === "update") {
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
  if (task.from === "class_component") {
    // 组件状态更新任务
    // 获取到组件的实例对象，再获取到最外层节点的fiber对象
    const root = getRoot(task.instance);
    task.instance.__fiber.partialState = task.partialState;
    return {
      props: root.props,
      stateNode: root.stateNode,
      tag: "host_root",
      effects: [],
      child: null,
      alternate: root,
    };
  }
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
  // 有alternate说明有备份节点，fiber.alternate.child其实是children数组中第一个子节点的备份节点
  if (fiber.alternate && fiber.alternate.child) {
    alternate = fiber.alternate.child;
  }
  // while第一次循环时，element = arrifiedChildren[0]就是children数组中第一个子节点，在循环中，需要更新alternate存储的备份节点
  while (index < numberOfElements || alternate) {
    element = arrifiedChildren[index];

    // 如果element不存在，但是所对应的备份节点存在
    if (!element && alternate) {
      //删除操作
      alternate.effectTag = "delete";
      fiber.effects.push(alternate);
    } else if (element && alternate) {
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
    } else if (element) {
      prevFiber.sibling = newFiber;
    }
    // 判断备份节点是否有兄弟节点
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
    if (fiber.stateNode.__fiber && fiber.stateNode.__fiber.partialState) {
      fiber.stateNode.state = {
        ...fiber.stateNode.state,
        ...fiber.stateNode.__fiber.partialState,
      };
    }
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
  if (subTask || !taskQueue.isEmpty()) {
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

export const scheduleUpdate = (instance, partialState) => {
  taskQueue.push({
    from: "class_component",
    instance,
    partialState,
  });
  requestIdleCallback(performTask);
};
```
