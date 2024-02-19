# 更改代码如下

```javascript
const reconcileChildren = (fiber, children) => {
-   while (index < numberOfElements){
+   while (index < numberOfElements || alternate) {
+       // 如果element不存在，但是所对应的备份节点存在
+       if (!element && alternate) {
+       //删除操作
+       alternate.effectTag = "delete";
+       fiber.effects.push(alternate);
        } else if (element && alternate) {...}

        ...

        // 为父级fiber添加子级fiber
        if (index == 0) {
        fiber.child = newFiber;
-       } else {
+       } else if (element) {
        prevFiber.sibling = newFiber;
        }

    }
}
```

```javascript
const commitAllWork = (fiber) => {
    fiber.effects.forEach((item) => {
+       if (item.effectTag === "delete") {
+           item.parent.stateNode.removeChild(item.stateNode);
        } else if (item.effectTag === "update") {
    }
}
```
