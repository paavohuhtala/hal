import { AbstractReadAtom, AtomValue } from ".";
import { combineLatest, BehaviorSubject } from "rxjs";
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
  extends BehaviorSubject<CombineAtoms<O>>
  implements AbstractReadAtom<CombineAtoms<O>> {
  constructor(atoms: O) {
    // This is safe, because the subscribe() call below immediately calls next()
    super(undefined!);

    combineLatest(
      ...Object.entries(atoms).map(([k, obs]) =>
        obs.pipe(map(x => ({ [k]: x })))
      )
    )
      .pipe(map(combinePartsUnsafe<CombineAtoms<O>>()))
      .subscribe(this);
  }

  get(): CombineAtoms<O> {
    return this.getValue();
  }

  view<B>(getter: ReadLens<CombineAtoms<O>, B>): AbstractReadAtom<B> {
    return LensedReadAtom.create(this, getter);
  }
}
