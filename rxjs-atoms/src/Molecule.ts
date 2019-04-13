import { AbstractReadAtom, AtomValue } from ".";
import { Observable, combineLatest, Subscriber } from "rxjs";
import { map } from "rxjs/operators";
import { ReadLens } from "./Lens";
import { LensedReadAtom } from "./Atom";

type CombineAtoms<O extends Record<any, AbstractReadAtom<any>>> = {
  [K in keyof O]: AtomValue<O[K]>
};

const combinePartsUnsafe = <T extends object>() => (parts: object[]): T => {
  return parts.reduce((obj, subObj) => ({ ...obj, ...subObj }), {}) as T;
};

export class Molecule<O extends Record<any, AbstractReadAtom<any>>>
  extends Observable<CombineAtoms<O>>
  implements AbstractReadAtom<CombineAtoms<O>> {
  private subscribers: Subscriber<CombineAtoms<O>>[] = [];

  private innerAtoms: O;
  private combinedObservable: Observable<CombineAtoms<O>>;
  private combinedValue: CombineAtoms<O>;

  constructor(atoms: O) {
    super(emitter => {
      this.subscribers.push(emitter);
      emitter.next(this.combinedValue);
    });

    this.innerAtoms = atoms;
    this.combinedValue = this.forceGet();

    this.combinedObservable = combineLatest(
      ...Object.entries(atoms).map(([k, obs]) =>
        obs.pipe(map(x => ({ [k]: x })))
      )
    ).pipe(map(combinePartsUnsafe<CombineAtoms<O>>()));

    this.combinedObservable.subscribe(parts => {
      this.notify(parts);
    });
  }

  get(): CombineAtoms<O> {
    if (this.combinedValue === undefined) {
      this.combinedValue = this.forceGet();
    }
    return this.combinedValue;
  }

  private forceGet(): CombineAtoms<O> {
    return combinePartsUnsafe<CombineAtoms<O>>()(
      Object.entries(this.innerAtoms).map(([k, v]) => ({ [k]: v.get() }))
    );
  }

  view<B>(getter: ReadLens<CombineAtoms<O>, B>): AbstractReadAtom<B> {
    return LensedReadAtom.create(this, getter);
  }

  private notify(x: CombineAtoms<O>) {
    this.subscribers.forEach(emitter => !emitter.closed && emitter.next(x));
  }
}
