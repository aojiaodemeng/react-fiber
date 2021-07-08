const getTag = (vodm) => {
  // type值示例： type: "div"
  if (typeof vodm.type === "string") {
    return "host_component";
  }
};

export default getTag;
