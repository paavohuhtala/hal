// Based on https://www.reaktor.com/blog/make-react-reactive-by-using-hooks/

import React from "react";
import { AbstractReadAtom } from "rxjs-atoms";

export function useAtom<T>(atom: AbstractReadAtom<T>) {
  let value = atom.get();
  const [, redraw] = React.useReducer(x => !x, true);

  React.useEffect(() => {
    const sub = atom.subscribe(x => {
      value = x;
      redraw({});
    });

    return () => {
      sub.unsubscribe();
    };
  });

  return value;
}
