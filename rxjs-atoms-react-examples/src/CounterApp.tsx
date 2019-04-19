import { Atom, AbstractAtom } from "rxjs-atoms/src";
import React from "react";
import { useAtom } from "rxjs-atoms-react";
import { Observable, combineLatest } from "rxjs";
import { map } from "rxjs/operators";
import { useChildren } from "../../rxjs-atoms-react/src";

const P: React.SFC = props => {
  return <p>{useChildren(props.children)}</p>;
};

function zip<A, B, C>(
  a: Observable<A>,
  b: Observable<B>,
  f: (x: A, y: B) => C
): Observable<C> {
  return combineLatest(a, b).pipe(map(([a, b]) => f(a, b)));
}

const Counter: React.SFC<{ value: AbstractAtom<number>; label: string }> = ({
  value,
  label
}) => {
  const x = useAtom(value);

  const increment = () => value.modify(x => x + 1);
  const decrement = () => value.modify(x => x - 1);

  return (
    <div
      style={{
        padding: "0.5em",
        margin: "1em",
        border: "1px solid black"
      }}
    >
      <button onClick={increment}>+</button>
      <p>
        {label}: {x}
      </p>
      <button onClick={decrement}>-</button>
    </div>
  );
};

const appStateA = new Atom({
  a: 0,
  b: 0
});

const aA = appStateA.prop("a");
const bA = appStateA.prop("b");

const CounterApp: React.SFC = () => (
  <>
    <Counter value={aA} label="A" />
    <Counter value={bA} label="B" />
    <Counter value={aA} label="Also A" />
    <P>{aA}</P>
    <P>A * B = {zip(aA, bA, (a, b) => a * b)}</P>
  </>
);

export default CounterApp;
