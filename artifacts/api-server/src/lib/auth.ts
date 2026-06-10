import jwt from "jsonwebtoken";

const SECRET = process.env.SESSION_SECRET ?? "attendance_secret_dev";

export interface JwtPayload {
  id: number;
  email: string;
  role: "admin" | "faculty" | "student";
  name: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
