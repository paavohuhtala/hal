import { Observable, Subscriber } from "rxjs";
import { Lens, ReadLens, EitherLens } from "./Lens";

type EitherAtom<T> = AbstractReadAtom<T> | AbstractAtom<T>;

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
  private currentValue: T;

  constructor(value: T) {
    super(emitter => {
      this.subscribers.push(emitter);
      emitter.next(this.currentValue);
    });

    this.currentValue = value;
  }

  get() {
    return this.currentValue;
  }

  set(value: T) {
    this.currentValue = value;
    this.notify(value);
  }

  modify(f: (oldValue: T) => T) {
    this.set(f(this.currentValue));
    return this.currentValue;
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
    this.subscribers.forEach(emitter => !emitter.closed && emitter.next(x));
  }
}

export class LensedAtom<T> extends Observable<T> implements AbstractAtom<T> {
  private subscribers: Subscriber<T>[] = [];
  private inner: AbstractAtom<any>;
  private lens: Lens<any, T>;
  private currentValue: T;

  private constructor(atom: AbstractAtom<any>, lens: Lens<any, T>) {
    super(emitter => {
      this.subscribers.push(emitter);
      emitter.next(this.currentValue);
    });

    this.currentValue = lens.get(atom.get());

    this.inner = atom;
    this.lens = lens;

    this.inner.subscribe({
      next: x => {
        const newValue = this.lens.get(x);

        if (this.currentValue !== newValue) {
          this.currentValue = newValue;
          this.subscribers.forEach(
            emitter => !emitter.closed && emitter.next(this.currentValue!)
          );
        }
      }
    });
  }

  get() {
    return this.currentValue;
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

export class LensedReadAtom<T> extends Observable<T>
  implements AbstractReadAtom<T> {
  private subscribers: Subscriber<T>[] = [];
  private inner: AbstractReadAtom<any>;
  private lens: ReadLens<any, T>;
  private currentValue: T;

  private constructor(atom: AbstractReadAtom<any>, lens: ReadLens<any, T>) {
    super(emitter => {
      this.subscribers.push(emitter);
      emitter.next(this.currentValue);
    });

    this.currentValue = lens.get(atom.get());
    this.inner = atom;
    this.lens = lens;

    this.inner.subscribe({
      next: x => {
        if (this.subscribers.length === 0) return;
        const newValue = this.lens.get(x);

        if (this.currentValue !== newValue) {
          this.currentValue = newValue;
          this.subscribers.forEach(
            emitter => !emitter.closed && emitter.next(this.currentValue)
          );
        }
      }
    });
  }

  private forceGet() {
    return this.lens.get(this.inner.get());
  }

  get() {
    if (this.currentValue === undefined) {
      this.currentValue = this.forceGet();
    }

    return this.currentValue;
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
