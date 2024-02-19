# 一、概述

fiber 对象中的 tag 属性，标识了当前节点是一个普通节点还是一个组件。在之前，处理子节点时，都是直接写成了静态数据“hots_component”，表明是一个普通节点，因为，需要将其变成动态数据。

注意根节点的 tag 值永远是“host_root”

# 二、更新代码

```javascript
// 创建src/react/Misc/getTag/index.js
const getTag = (vodm) => {
  // type值示例： type: "div"
  if (typeof vodm.type === "string") {
    return "host_component";
  }
};
export default getTag;
```

```javascript
const reconcileChildren = (fiber, children) => {
  ...
  while (index < numberOfElements) {
    element = arrifiedChildren[index];
    newFiber = {
      type: element.type,
      props: element.props,
-     tag: "host_component",
+     tag: getTag(element),
      effects: [],
      effectTag: "placement",
      parent: fiber,
    };
    ...
  }
};
```
