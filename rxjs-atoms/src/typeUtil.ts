// https://medium.freecodecamp.org/typescript-curry-ramda-types-f747e99744ab

export type Head<A extends any[]> = A extends [any, ...any[]] ? A[0] : never;
export type Tail<A extends any[]> = ((...t: A) => any) extends ((
  _: any,
  ...tail: infer Rest
) => any)
  ? Rest
  : [];

export type Prepend<E, T extends any[]> = ((
  head: E,
  ...args: T
) => any) extends ((...args: infer U) => any)
  ? U
  : T;

export type Equals<A, B> = A extends B ? (B extends A ? true : false) : false;
