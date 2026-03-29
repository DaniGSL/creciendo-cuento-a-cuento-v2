import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "ccc_session";
export const ADMIN_COOKIE_NAME = "ccc_admin";

export interface SessionPayload {
  profileId: string;
}

export interface AdminPayload {
  role: "admin";
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

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
}

export async function verifyAdminToken(
  token: string
): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== "admin") return null;
    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}
