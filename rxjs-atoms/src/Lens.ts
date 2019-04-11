type Getter<O, P> = (obj: O) => P;
type Setter<O, P> = (obj: O, x: P) => O;

export class ReadLens<O, P> {
  _get: Getter<O, P>;

  constructor(get: Getter<O, P>) {
    this._get = get;
  }

  compose<B>(lens: ReadLens<P, B>): ReadLens<O, B> {
    return new ReadLens(x => lens._get(this._get(x)));
  }

  get(o: O): P {
    return this._get(o);
  }

  then<B>(getter: Getter<P, B>): ReadLens<O, B> {
    return this.compose(new ReadLens(getter));
  }

  prop<K extends keyof P>(key: K): ReadLens<O, P[K]> {
    return this.then(x => x[key]);
  }
}

export class Lens<O, P> extends ReadLens<O, P> {
  _set: Setter<O, P>;

  constructor(get: Getter<O, P>, set: Setter<O, P>) {
    super(get);
    this._set = set;
  }

  compose<B>(lens: Lens<P, B>): Lens<O, B> {
    return new Lens(
      o => lens._get(this._get(o)),
      (o, x) => this._set(o, lens._set(this._get(o), x))
    );
  }

  prop<K extends keyof P>(key: K): Lens<O, P[K]> {
    return this.compose(prop<any, K>(key));
  }

  set(o: O, x: P): O {
    return this._set(o, x);
  }

  modify(o: O, f: (x: P) => P): O {
    return this._set(o, f(this._get(o)));
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
