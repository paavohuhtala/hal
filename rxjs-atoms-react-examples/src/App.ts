import { Atom, L, AtomValue } from "rxjs-atoms";
import { map, tap } from "rxjs/operators";

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

nameA.subscribe({
  next: x => console.log("Name changed :D", x)
});

nameA.view(L.prop("length")).subscribe({
  next: x => console.log("Length of name changed :D", x)
});

juiceHoursA
  .pipe(
    tap(x => console.log(`Hours before map: ${x}`)),
    map(x => x * 2),
    tap(x => console.log(`Hours after map: ${x}`))
  )
  .subscribe({ next: console.log });

juiceHoursA.modify(x => (x += 4));

nameA.set("Pavel");
