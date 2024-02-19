# 一、实现思路

要构建子节点的 fiber 对象，就需要获取子节点对应的 virtual dom 对象，这个 vdom 对象可以通过 fiber.props.children 获取。新建 reconcileChildren 方法，传入两个参数（父、子）,要传入父节点的原因是，构建完子节点之后需要告诉子节点谁是父级，同时告诉父级谁是子级。

在 reconcileChildren 方法中，需要判断 children 是数组还是对象（在 render 方法中 children 传的是 element，它是一个对象，而在 createElement 方法中返回的是一个数组）。新建 arrified 方法，对此情况进行处理：如果是数组就直接返回，如果是对象，就包裹在一个数组中再返回。

# 二、更新代码

```javascript
// 新建src/react/Misc/Arrified/index.js
const arrified = (arg) => (Array.isArray(arg) ? arg : [arg]);
export default arrified;
```

```javascript
// src/react/Misc/reconciliation/index.js
const reconcileChildren = (fiber, children) => {
  // 1.children可能是对象也可能是数组。需要将children转换成数组
  const arrifiedChildren = arrified(children);
  // 2.拿到数组中的vdom，转成fiber
  let index = 0;
  let numberOfElements = arrifiedChildren.length;
  let element = null;
  let newFiber = null;
  let prevFiber = null;
  while (index < numberOfElements) {
    element = arrifiedChildren[index];
    newFiber = {
      type: element.type,
      props: element.props,
      tag: "host_component",
      effects: [],
      effectTag: "placement",
      stateNode: null,
      parent: fiber,
    };

    if (index == 0) {
      fiber.child = newFiber;
    } else {
      prevFiber.sibling = newFiber;
    }
    prevFiber = newFiber;
    index++;
  }
};
const executeTask = (fiber) => {
  reconcileChildren(fiber, fiber.props.children);
};
```

# 三、完整代码

```javascript
// src/react/Misc/reconciliation/index.js
import { createTaskQueue, arrified } from "../Misc";

const taskQueue = createTaskQueue();
// 默认没有任务
let subTask = null;
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
  while (index < numberOfElements) {
    element = arrifiedChildren[index];
    newFiber = {
      type: element.type,
      props: element.props,
      tag: "host_component",
      effects: [],
      effectTag: "placement",
      stateNode: null,
      parent: fiber,
    };

    if (index == 0) {
      fiber.child = newFiber;
    } else {
      prevFiber.sibling = newFiber;
    }
    prevFiber = newFiber;
    index++;
  }
};
const executeTask = (fiber) => {
  reconcileChildren(fiber, fiber.props.children);
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
