type Equals<A, B> = A extends B ? (B extends A ? true : false) : false;

type PropIsReadonly<O, K extends keyof O> = Equals<
  Pick<O, K>,
  Readonly<Record<K, O[K]>>
>;
