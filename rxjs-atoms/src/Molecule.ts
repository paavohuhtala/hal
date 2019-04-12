import { AbstractReadAtom, AtomValue } from ".";
import { Observable, combineLatest } from "rxjs";
import { map } from "rxjs/operators";
import { ReadLens } from "./Lens";
import { LensedReadAtom } from "./Atom";

type CombineAtoms<O extends Record<any, AbstractReadAtom<any>>> = {
  [K in keyof O]: AtomValue<O[K]>
};

export class Molecule<O extends Record<any, AbstractReadAtom<any>>>
  extends Observable<CombineAtoms<O>>
  implements AbstractReadAtom<CombineAtoms<O>> {
  private subscribers: Array<(x: CombineAtoms<O>) => void> = [];

  private innerAtoms: O;
  private combinedObservable: Observable<CombineAtoms<O>>;
  private combinedValue?: CombineAtoms<O>;

  constructor(atoms: O) {
    super(emitter => {
      this.subscribers.push(x => emitter.next(x));
    });

    this.innerAtoms = atoms;

    this.combinedObservable = combineLatest(
      ...Object.entries(atoms).map(([k, obs]) =>
        obs.pipe(map(x => ({ [k]: x })))
      )
    ).pipe(
      map(parts => parts.reduce((obj, subObj) => ({ ...obj, ...subObj }), {}))
    );

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
    return Object.entries(this.innerAtoms)
      .map(([k, v]) => ({ [k]: v.get() }))
      .reduce((obj, subObj) => ({ ...obj, ...subObj })) as CombineAtoms<O>;
  }

  view<B>(getter: ReadLens<CombineAtoms<O>, B>): AbstractReadAtom<B> {
    return LensedReadAtom.create(this, getter);
  }

  private notify(x: CombineAtoms<O>) {
    this.subscribers.forEach(f => f(x));
  }
}
