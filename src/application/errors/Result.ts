export class Result<T, E = Error> {
  private constructor(
    public readonly isSuccess: boolean,
    public readonly error?: E,
    private readonly _value?: T
  ) {
    if (isSuccess && error) {
      throw new Error("InvalidOperation: A result cannot be successful and contain an error");
    }
    if (!isSuccess && !error) {
      throw new Error("InvalidOperation: A failing result needs to contain an error message");
    }
  }

  public get value(): T {
    if (!this.isSuccess) {
      throw new Error("Can't get the value of an error result. Use 'error' instead.");
    }
    return this._value as T;
  }

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, undefined, value);
  }

  public static fail<U, E>(error: E): Result<U, E> {
    return new Result<U, E>(false, error);
  }
}
