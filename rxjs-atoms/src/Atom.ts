import { Observable, Subscriber } from "rxjs";
import { Lens, ReadLens } from "./Lens";

type EitherAtom<T> = AbstractReadAtom<T> | AbstractAtom<T>;
type EitherLens<O, L> = Lens<O, L> | ReadLens<O, L>;

export type AtomValue<A extends EitherAtom<any>> = A extends EitherAtom<infer T>
  ? T
  : never;

type LensAtomWith<
  O extends EitherAtom<any>,
  L extends EitherLens<any, any>
> = O extends AbstractAtom<infer A>
  ? L extends Lens<A, infer B>
    ? AbstractAtom<B>
    : L extends ReadLens<A, infer B>
    ? AbstractReadAtom<B>
    : never
  : O extends AbstractReadAtom<infer A>
  ? L extends EitherLens<A, infer B>
    ? AbstractReadAtom<B>
    : never
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

export class Atom<T> extends Observable<T> implements AbstractAtom<T> {
  private subscribers: Subscriber<T>[] = [];
  private __value: T;

  constructor(value: T) {
    super(emitter => {
      this.subscribers.push(emitter);
    });

    this.__value = value;
  }

  get value() {
    return this.__value;
  }

  set value(value) {
    this.__value = value;
    this.notify(value);
  }

  get() {
    return this.value;
  }

  set(value: T) {
    this.value = value;
  }

  modify(f: (oldValue: T) => T) {
    this.set(f(this.__value));
    return this.__value;
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

  private notify(x: T) {
    this.subscribers.forEach(emitter => emitter.next(x));
  }
}

export class LensedAtom<T> extends Observable<T> implements AbstractAtom<T> {
  private subscribers: Array<(x: T) => void> = [];
  private inner: AbstractAtom<any>;
  private __lens: Lens<any, T>;
  private __currentValue: T | undefined;

  private constructor(atom: AbstractAtom<any>, lens: Lens<any, T>) {
    super(emitter => {
      this.subscribers.push(x => emitter.next(x));
    });

    this.inner = atom;
    this.__lens = lens;

    this.inner.subscribe({
      next: x => {
        if (this.subscribers.length === 0) return;
        const newValue = this.__lens.get(x);

        if (
          this.__currentValue === undefined ||
          this.__currentValue !== newValue
        ) {
          this.__currentValue = newValue;
          this.subscribers.forEach(f => f(this.__currentValue!));
        }
      }
    });
  }

  private forceGet() {
    return this.__lens.get(this.inner.get());
  }

  get() {
    if (this.__currentValue === undefined) {
      this.__currentValue = this.forceGet();
    }

    return this.__currentValue;
  }

  set(value: T) {
    this.inner.modify(x => this.__lens.set(x, value));
  }

  modify(f: (oldValue: T) => T) {
    this.inner.modify(x => this.__lens.modify(x, f));
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

export class LensedReadAtom<T> extends Observable<T>
  implements AbstractReadAtom<T> {
  private subscribers: Array<(x: T) => void> = [];
  private inner: AbstractReadAtom<any>;
  private __lens: ReadLens<any, T>;
  private __currentValue: T | undefined;

  private constructor(atom: AbstractReadAtom<any>, lens: ReadLens<any, T>) {
    super(emitter => {
      this.subscribers.push(x => emitter.next(x));
    });

    this.inner = atom;
    this.__lens = lens;

    this.inner.subscribe({
      next: x => {
        if (this.subscribers.length === 0) return;
        const newValue = this.__lens.get(x);

        if (
          this.__currentValue === undefined ||
          this.__currentValue !== newValue
        ) {
          this.__currentValue = newValue;
          this.subscribers.forEach(f => f(this.__currentValue!));
        }
      }
    });
  }

  private forceGet() {
    return this.__lens.get(this.inner.get());
  }

  get() {
    if (this.__currentValue === undefined) {
      this.__currentValue = this.forceGet();
    }

    return this.__currentValue;
  }

  view<B>(getter: ReadLens<T, B>): AbstractReadAtom<B> {
    return this.inner.view(this.__lens.compose(getter));
  }

  static create<A, B>(
    atom: AbstractReadAtom<A>,
    lens: ReadLens<A, B>
  ): LensedReadAtom<B> {
    return new LensedReadAtom(atom, lens);
  }
}
