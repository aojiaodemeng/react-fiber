import { createDOMElement } from "../../DOM";
const createStateNode = (fiber) => {
  // 是普通节点，则调用createDOMElement创建这个普通节点
  if (fiber.tag === "host_component") {
    return createDOMElement(fiber);
  }
};

export default createStateNode;
