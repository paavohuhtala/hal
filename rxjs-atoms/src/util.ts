export function compose<A, B, C>(f: (x: A) => B, g: (x: B) => C): (x: A) => C {
  return x => g(f(x));
}

export function id<T>(x: T): T {
  return x;
}
