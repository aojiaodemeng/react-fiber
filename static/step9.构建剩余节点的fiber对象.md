主要实现：构建同级的子级

```javascript
const executeTask = (fiber) => {
  reconcileChildren(fiber, fiber.props.children);

  // 如果有子级，就返回子级，将这个子级当作父级，构建这个父级下的子级
  if (fiber.child) {
    return fiber.child;
  }

  let currentExecutelyFiber = fiber;

  // 没有子级，就判断是否有同级，有同级直接返回同级，没有同级就退到其父级，判断父级是否有同级
  while (currentExecutelyFiber.parent) {
    if (currentExecutelyFiber.sibling) {
      return currentExecutelyFiber.sibling;
    }
    currentExecutelyFiber = currentExecutelyFiber.parent;
  }
  console.log(fiber);
};
```
