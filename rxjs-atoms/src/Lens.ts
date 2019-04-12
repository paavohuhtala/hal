import { U } from ".";

type Getter<O, P> = (obj: O) => P;
type Setter<O, P> = (obj: O, x: P) => O;

export type EitherLens<O, L> = Lens<O, L> | ReadLens<O, L>;

export class ReadLens<O, P> {
  _get: Getter<O, P>;

  constructor(get: Getter<O, P>) {
    this._get = get;
  }

  compose<B>(lens: ReadLens<P, B>): ReadLens<O, B> {
    return new ReadLens(
      U.compose(
        this._get,
        lens._get
      )
    );
  }

  get(o: O): P {
    return this._get(o);
  }

  map<B>(getter: Getter<P, B>): ReadLens<O, B> {
    return this.compose(new ReadLens(getter));
  }

  prop<K extends keyof P>(key: K): ReadLens<O, P[K]> {
    return this.map(x => x[key]);
  }
}

export class Lens<O, P> extends ReadLens<O, P> {
  _set: Setter<O, P>;

  constructor(get: Getter<O, P>, set: Setter<O, P>) {
    super(get);
    this._set = set;
  }

  compose<B>(lens: Lens<P, B>): Lens<O, B>;
  compose<B>(lens: ReadLens<P, B>): ReadLens<O, B>;
  compose<B>(lens: EitherLens<P, B>): EitherLens<O, B> {
    const getter = U.compose(
      this._get,
      lens._get
    );

    if (lens instanceof Lens) {
      return new Lens(getter, (o, x) =>
        this._set(o, lens._set(this._get(o), x))
      );
    } else {
      return new ReadLens(getter);
    }
  }

  set(o: O, x: P): O {
    return this._set(o, x);
  }

  modify(o: O, f: (x: P) => P): O {
    return this._set(o, f(this._get(o)));
  }

  prop<K extends keyof P>(key: K): Lens<O, P[K]> {
    return this.compose(prop<P, K>(key));
  }

  asRead(): ReadLens<O, P> {
    return this.compose(new ReadLens(U.id));
  }
}

export function prop<O, K extends keyof O>(key: K): Lens<O, O[K]> {
  return new Lens(o => o[key], (o, x) => ({ ...o, [key]: x }));
}

export function map<A, B>(f: Getter<A, B>) {
  return new ReadLens(f);
}

export function id<O>(): Lens<O, O> {
  return new Lens(o => o, (_, o) => o);
}

export function iso<A, B>(from: (x: A) => B, to: (x: B) => A): Lens<A, B> {
  return new Lens(from, (_, x) => to(x));
}

export function nth<A extends any[], I extends keyof A = number>(
  index: I
): Lens<A, A[I]> {
  return new Lens(
    a => a[index],
    (a, x) => {
      const arr = [...a];
      arr[index as any] = x;
      return arr as A;
    }
  );
}
