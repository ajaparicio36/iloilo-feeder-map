export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = "AuthError";
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor() {
    super("Invalid email or password", 401);
    this.name = "InvalidCredentialsError";
  }
}

export class EmailAlreadyExistsError extends AuthError {
  constructor() {
    super("Email already exists", 409);
    this.name = "EmailAlreadyExistsError";
  }
}

export class TokenExpiredError extends AuthError {
  constructor() {
    super("Token has expired", 401);
    this.name = "TokenExpiredError";
  }
}

export class InvalidTokenError extends AuthError {
  constructor() {
    super("Invalid token", 401);
    this.name = "InvalidTokenError";
  }
}

export class UnauthorizedError extends AuthError {
  constructor() {
    super("Unauthorized access", 401);
    this.name = "UnauthorizedError";
  }
}

export class ValidationError extends AuthError {
  constructor(message: string) {
    super(message, 400);
    this.name = "ValidationError";
  }
}
