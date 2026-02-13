import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export interface AuthPayload {
  staff_id: number;
  role_id: number;
}

export async function getAuthUser(): Promise<AuthPayload> {
  const token = (await cookies()).get("auth_token")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  return jwt.verify(
    token,
    process.env.JWT_SECRET as string
  ) as AuthPayload;
}
