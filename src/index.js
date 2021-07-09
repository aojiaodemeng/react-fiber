import React, { render, Component } from "./react";
const root = document.getElementById("root");
const jsx = (
  <div>
    <p>hello React</p>
    <p>hello Fiber</p>
  </div>
);

class Greating extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return <div>hhhhhh</div>;
  }
}

render(<Greating />, root);
