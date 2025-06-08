import { SignJWT, jwtVerify } from "jose";
import { TokenExpiredError, InvalidTokenError } from "./errors";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key"
);

export interface JWTPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  try {
    const token = await new SignJWT(payload as any)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(SECRET);

    return token;
  } catch (error) {
    throw error;
  }
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, SECRET);

    // Type assertion to our custom payload type
    const customPayload = payload as unknown as JWTPayload;

    // Validate that required fields exist
    if (
      !customPayload.userId ||
      !customPayload.email ||
      typeof customPayload.isAdmin !== "boolean"
    ) {
      throw new InvalidTokenError();
    }

    return customPayload;
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Check for JWT expired error
      if (
        error.message.includes("expired") ||
        (error as any).code === "ERR_JWT_EXPIRED"
      ) {
        throw new TokenExpiredError();
      }
    }

    throw new InvalidTokenError();
  }
}
