import React, { render, Component } from "./react";
const root = document.getElementById("root");
const jsx = (
  <div>
    <p>hello React</p>
    <p>hello Fiber</p>
  </div>
);

render(jsx, root);

setTimeout(() => {
  const jsx = (
    <div>
      <p>奥利给</p>
      <p>hello Fiber</p>
    </div>
  );
  render(jsx, root);
}, 2000);
