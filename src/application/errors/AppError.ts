export class AppError extends Error {
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, code: string, isOperational = true) {
    super(message);
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    (Error as any).captureStackTrace?.(this);
  }
}
