# 一、概述

已经实现了节点的 fiber 对象构建，现在需要将所有 fiber 对象存储在一个数组中，为何要将 fiber 对象存放在一个数组中呢？
因为在 fiber 算法的第二阶段，需要循环遍历这个数组，统一获取 fiber 对象，从而构建真实 dom 对象，并将其添加到页面中，接下来的问题是，如何构建这个数组。—— 需要用到 fiber 对象中的 effects 数组。effects 数组就是用来存放 fiber 对象的。最终目标是，将所有 fiber 对象都存储在最外层节点的 effects 数组中。

要达到这个目的：首先需要知道，除了最外层节点的 fiber 对象有 effects 数组，每个 fiber 对象都有 effects 数组，最外层节点的 fiber 对象的 effects 数组存放所有 fiber 对象，其他的 fiber 对象负责协助收集 fiber 对象。

实现思路：当左侧节点树中的节点全部构建完成之后，开启 for 循环去构建其他节点，在构建其他节点过程中，会找到每个节点的父级 fiber 对象，此时，
就可以为这个节点的 effects 数组添加 fiber 对象，准确来说，要通过数组的合并操作，将父级 effects 数组与子级 effects 数组的值进行合并，子级 effects 数组要和子级 fiber 对象合并，数组的合并操作在 while 循环的过程中不断进行，在循环结束之后，最外层节点的 effects 数组就包含所有 fiber 对象了，因为循环的过程就是不断收集 fiber 对象的过程。

```javascript
const executeTask = (fiber) => {
  while (currentExecutelyFiber.parent) {
+   currentExecutelyFiber.parent.effects =
+     currentExecutelyFiber.parent.effects.concat(
+       currentExecutelyFiber.effects.concat([currentExecutelyFiber])
+     );
    if (currentExecutelyFiber.sibling) {
      return currentExecutelyFiber.sibling;
    }
    currentExecutelyFiber = currentExecutelyFiber.parent;
  }
}
```
