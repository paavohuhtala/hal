import React from "react";
import ReactDOM from "react-dom";

import { Atom, L, AtomValue, AbstractReadAtom, Molecule } from "rxjs-atoms";
import { useAtom } from "rxjs-atoms-react";

const state = new Atom({
  author: {
    name: "Paavo",
    juiceHours: 0
  }
});

state.subscribe({
  next: x => console.log("State changed: ", x)
});

const stateL = L.id<AtomValue<typeof state>>();
const nameA = state.view(stateL.prop("author").prop("name"));

const authorA = state.view(L.prop("author"));
const juiceHoursA = authorA.view(L.prop("juiceHours"));

const hmmm = new Molecule({
  molecularName: authorA.view(L.prop("name")),
  molecularHours: authorA.view(L.prop("juiceHours"))
});

hmmm.subscribe(x => console.log("molecule changed :D", x));

nameA.subscribe({
  next: x => console.log("Name changed :D", x)
});

juiceHoursA.modify(x => (x += 4));

nameA.set("Pavel");

const HourIndicator: React.SFC<{
  hours: AbstractReadAtom<number>;
}> = React.memo(({ hours }) => {
  const hoursValue = useAtom(hours);
  return <p>{hoursValue}</p>;
});

const TestApp: React.SFC = () => {
  const doWork = React.useCallback(() => juiceHoursA.modify(x => x + 1), [
    juiceHoursA
  ]);
  const tenXHours = React.useMemo(() => juiceHoursA.view(L.map(x => x * 10)), [
    juiceHoursA
  ]);

  return (
    <div>
      <HourIndicator hours={tenXHours} />
      <button onClick={doWork}>More jäsä</button>
    </div>
  );
};

ReactDOM.render(<TestApp />, document.getElementById("app"));
