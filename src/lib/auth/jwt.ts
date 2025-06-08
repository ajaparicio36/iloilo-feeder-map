import { SignJWT, jwtVerify, type JWTPayload as JoseJWTPayload } from "jose";
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
  console.log("🔏 Signing token with payload:", payload);
  console.log("🔏 Using SECRET:", !!SECRET);

  try {
    const token = await new SignJWT(payload as any)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(SECRET);

    console.log("🔏 Generated token:", token.substring(0, 20) + "...");
    return token;
  } catch (error) {
    console.error("❌ Token signing error:", error);
    throw error;
  }
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    console.log("🔑 Verifying token:", token.substring(0, 20) + "...");
    console.log("🔑 Using SECRET:", !!SECRET);

    const { payload } = await jwtVerify(token, SECRET);
    console.log("✅ Token decoded successfully:", payload);

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
    console.error("❌ JWT verification error:", error);

    if (error instanceof Error) {
      console.error("❌ Error type:", error.constructor.name);
      console.error("❌ Error message:", error.message);

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
