import { Atom } from "./Atom";
import { L } from ".";
import { timeout, skip } from "rxjs/operators";

describe("Atom", () => {
  it("initializes the state with the constructor parameter", () => {
    const stateA = new Atom({ x: 0 });
    expect(stateA.get()).toStrictEqual({ x: 0 });
  });

  it("returns initial state on subscribe", cb => {
    expect.assertions(1);

    const stateA = new Atom({ x: 123 });

    stateA.subscribe(state => {
      expect(state).toStrictEqual({ x: 123 });
      cb();
    });
  });

  it("fires an event when the value changes", cb => {
    expect.assertions(1);
    const stateA = new Atom({ x: 0 });

    stateA.pipe(skip(1)).subscribe(state => {
      expect(state).toStrictEqual({ x: 100 });
      cb();
    });

    stateA.set({ x: 100 });
  });
});

describe("LensedAtom", () => {
  it("returns initial state on subscribe", cb => {
    expect.assertions(1);

    const stateA = new Atom({ x: 123 });
    const stateXA = stateA.view(L.prop("x"));

    stateXA.subscribe(x => {
      expect(x).toEqual(123);
      cb();
    });
  });

  it("doesn't update when other parts of parent atom change", cb => {
    const stateA = new Atom({ x: 10, y: 0 });
    const stateXA = stateA.view(L.prop("x"));

    stateXA
      .pipe(skip(1))
      .pipe(timeout(0))
      .subscribe(
        res => {
          fail(`Expected no results, got ${res}`);
        },
        () => {
          cb();
        }
      );

    stateA.set({ x: 10, y: 100 });
  });
});
