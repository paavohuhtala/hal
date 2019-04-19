import React from "react";
import { AbstractAtom } from "rxjs-atoms";

export type BindInputProps = Pick<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
>;

/*export function bind(atom: AbstractAtom<string>): BindInputProps {
  return {
    onChange: e => atom.set(e.currentTarget.value),
    value: atom.get()
  };
}*/

const x = <input type="text" onChange={e => e} />;
