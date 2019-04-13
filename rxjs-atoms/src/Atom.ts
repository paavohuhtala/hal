import { Observable, BehaviorSubject } from "rxjs";
import { Lens, ReadLens, EitherLens } from "./Lens";
import { distinctUntilChanged, map } from "rxjs/operators";

type EitherAtom<T> = AbstractReadAtom<T> | AbstractAtom<T>;

export type AtomValue<A extends EitherAtom<any>> = A extends EitherAtom<infer T>
  ? T
  : never;

export interface AbstractReadAtom<T> extends Observable<T> {
  get(): T;
  view<B>(getter: ReadLens<T, B>): AbstractReadAtom<B>;
}

export interface AbstractAtom<T> extends AbstractReadAtom<T> {
  get(): T;
  set(x: T): void;
  modify(f: (oldValue: T) => T): void;

  view<B>(lens: Lens<T, B>): AbstractAtom<B>;
  view<B>(getter: ReadLens<T, B>): AbstractReadAtom<B>;
}

export class Atom<T> extends BehaviorSubject<T> implements AbstractAtom<T> {
  constructor(value: T) {
    super(value);
  }

  get() {
    return this.getValue();
  }

  set(value: T) {
    this.next(value);
  }

  modify(f: (oldValue: T) => T) {
    this.set(f(this.getValue()));
  }

  view<B>(lens: Lens<T, B>): AbstractAtom<B>;
  view<B>(getter: ReadLens<T, B>): AbstractReadAtom<T>;
  view<B>(lens: EitherLens<T, B>): EitherAtom<B> {
    if (lens instanceof Lens) {
      return LensedAtom.create(this, lens);
    } else {
      return LensedReadAtom.create(this, lens);
    }
  }
}

export class LensedAtom<T> extends BehaviorSubject<T>
  implements AbstractAtom<T> {
  private inner: AbstractAtom<any>;
  private lens: Lens<any, T>;

  private constructor(atom: AbstractAtom<any>, lens: Lens<any, T>) {
    super(lens.get(atom.get()));

    this.inner = atom;
    this.lens = lens;

    this.inner
      .pipe(map(lens._get))
      .pipe(distinctUntilChanged())
      .subscribe(this);
  }

  get() {
    return this.getValue();
  }

  set(value: T) {
    this.inner.modify(x => this.lens.set(x, value));
  }

  modify(f: (oldValue: T) => T) {
    this.inner.modify(x => this.lens.modify(x, f));
  }

  view<B>(lens: Lens<T, B>): AbstractAtom<B>;
  view<B>(getter: ReadLens<T, B>): AbstractReadAtom<T>;
  view<B>(lens: EitherLens<T, B>): EitherAtom<B> {
    if (lens instanceof Lens) {
      return LensedAtom.create(this, lens) as any;
    } else {
      return LensedReadAtom.create(this, lens) as any;
    }
  }

  static create<A, B>(atom: AbstractAtom<A>, lens: Lens<A, B>): LensedAtom<B> {
    return new LensedAtom(atom, lens);
  }
}

export class LensedReadAtom<T> extends BehaviorSubject<T>
  implements AbstractReadAtom<T> {
  private inner: AbstractReadAtom<any>;
  private lens: ReadLens<any, T>;

  private constructor(atom: AbstractReadAtom<any>, lens: ReadLens<any, T>) {
    super(lens.get(atom.get()));

    this.inner = atom;
    this.lens = lens;

    this.inner
      .pipe(map(lens._get))
      .pipe(distinctUntilChanged())
      .subscribe(this);
  }

  get() {
    return this.getValue();
  }

  view<B>(getter: ReadLens<T, B>): AbstractReadAtom<B> {
    return this.inner.view(this.lens.compose(getter));
  }

  static create<A, B>(
    atom: AbstractReadAtom<A>,
    lens: ReadLens<A, B>
  ): LensedReadAtom<B> {
    return new LensedReadAtom(atom, lens);
  }
}
