export function compose<A, B, C>(f: (x: A) => B, g: (x: B) => C): (x: A) => C {
  return x => g(f(x));
}

export function id<T>(x: T): T {
  return x;
}

export function flatMap<T>(arr: T[], f: (x: T) => T[]): T[] {
  const results: T[] = [];

  for (const x of arr) {
    for (const y of f(x)) {
      results.push(y);
    }
  }

  return results;
}

export function partition<T>(
  arr: T[],
  predicate: (x: T) => boolean
): [T[], T[]] {
  const groupA: T[] = [];
  const groupB: T[] = [];

  for (const x of arr) {
    if (predicate(x)) {
      groupA.push(x);
    } else {
      groupB.push(x);
    }
  }

  return [groupA, groupB];
}

export function indexed<T>(arr: T[]): [T, number][] {
  return arr.map((x, i) => [x, i]);
}

export const isInstanceOf = <F extends Function>(type: Function) => (
  x: any
): x is F => x instanceof type;

type Keys<O> = O extends Record<infer K, any> ? K : never;
type Values<O> = O extends Record<any, infer T> ? T : never;

export function entries<O extends Record<string, any>>(
  obj: O
): [Keys<O>, Values<O>][] {
  return Object.entries(obj) as any;
}
