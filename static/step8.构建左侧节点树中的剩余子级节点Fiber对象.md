# 一、更新代码

```javascript
const executeTask = (fiber) => {
  reconcileChildren(fiber, fiber.props.children);

+ if (fiber.child) {
+   return fiber.child;
+ }
+ console.log(fiber);

};
```
