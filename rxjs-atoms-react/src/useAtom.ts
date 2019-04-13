// Based on https://www.reaktor.com/blog/make-react-reactive-by-using-hooks/

import React from "react";
import { AbstractReadAtom } from "rxjs-atoms";

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
