import { createTaskQueue } from "../Misc";

const taskQueue = createTaskQueue();

// dom是父级
export const render = (element, dom) => {
  // 1.向任务队列中添加任务
  // 2.指定在浏览器空闲时执行任务

  // 任务就是通过vdom对象构建fiber对象
  taskQueue.push({
    dom,
    props: { children: element },
  });
  console.log(taskQueue.pop());
};
