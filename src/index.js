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
    this.state = {
      name: "张三",
    };
  }

  render() {
    return (
      <div>
        {this.props.title} hhh hhhh{this.state.name}
        <button onClick={() => this.setState({ name: "李四" })}>button</button>
      </div>
    );
  }
}

render(<Greating title="奥利给" />, root);

// setTimeout(() => {
//   const jsx = (
//     <div>
//       <p>hello Fiber</p>
//     </div>
//   );
//   render(jsx, root);
// }, 2000);
