import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "ccc_session";
export const ADMIN_COOKIE_NAME = "ccc_admin";

export interface SessionPayload {
  profileId: string;
}

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
};

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ profileId: payload.profileId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifyToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
