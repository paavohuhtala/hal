// Based on https://www.reaktor.com/blog/make-react-reactive-by-using-hooks/

import React from "react";
import { Observable, combineLatest, of as observableOf } from "rxjs";
import { map } from "rxjs/operators";
import { AbstractReadAtom, U, Molecule } from "rxjs-atoms";

export function useAtom<T>(atom: AbstractReadAtom<T>): T {
  let value = atom.get();
  const [, redraw] = React.useReducer(x => !x, true);

  React.useEffect(() => {
    const sub = atom.subscribe(() => {
      redraw({});
    });

    return () => sub.unsubscribe();
  }, [atom]);

  return value!;
}

/*type ObservableReactNode = React.ReactNode | Observable<React.ReactNode>;

function liftChildren(child: ObservableReactNode): Observable<React.ReactNode> {
  if (child instanceof Observable) {
    return child;
  }

  const arr = child as Array<ObservableReactNode>;

  const results: React.ReactNode[] = Array(arr.length);

  const [observables, nodes] = U.partition(
    U.indexed(arr),
    ([x, _]) => x instanceof Observable
  );

  for (const [node, i] of nodes) {
    results[i] = node;
  }

  const observablesWithIndices = observables.map(([obs, i]) =>
    (obs as Observable<React.ReactNode>).pipe(
      map(x => [x, i] as [React.ReactNode, number])
    )
  );

  return combineLatest(observablesWithIndices).subscribe(x => x);

  return new Observable(() => {});

  const observified = arr.map(x => {
    if (x instanceof Observable) {
      return x;
    } else {
      return observableOf(x);
    }
  });

  return combineLatest(observified);
}

export function useChildren(children: ObservableReactNode): React.ReactNode {
  const [values, setValues] = React.useState([] as React.ReactNode);

  const observableChildren = liftChildren(children);

  React.useEffect(() => {
    const sub = observableChildren.subscribe(setValues);
    return sub.unsubscribe;
  }, [children]);

  return values;
}*/

type AllowObservableProps<P> = { [K in keyof P]: P[K] | Observable<P[K]> };

export function liftComponent<P>(
  InnerComponent: React.ComponentType<P>
): React.ComponentType<AllowObservableProps<P>> {
  return class extends React.Component<AllowObservableProps<P>> {
    constructor(props: AllowObservableProps<P>) {
      super(props);

      const [observables, nonObservables] = U.partition(
        U.entries(props),
        U.isInstanceOf(Observable)
      );

      observables.map(x => x[1]);
    }

    componentDidMount() {}

    componentWillUpdate() {}

    render() {
      for (const observable of observables) {
      }

      //const molecule = new Molecule({});
      return <InnerComponent {...props} />;
    }
  };
}
