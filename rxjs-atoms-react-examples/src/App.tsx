import React from "react";
import ReactDOM from "react-dom";
import CounterApp from "./CounterApp";

const TestApp: React.SFC = () => {
  return (
    <>
      <CounterApp />
    </>
  );
};

ReactDOM.render(<TestApp />, document.getElementById("app"));
