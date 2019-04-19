import React, { ComponentType } from "react";
import { AbstractReadAtom } from "rxjs-atoms";

type LiftedProps<P> = { [K in keyof P]: P[K] | AbstractReadAtom<P[K]> };

/*export default function lift<P>(
  Component: React.ComponentType<P>
): ComponentType<LiftedProps<P> {
  return props => <Component {...props} />
}*/
