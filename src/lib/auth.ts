import "server-only";

import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { getDb } from "@/lib/db";

let auth: ReturnType<typeof createAuth> | undefined;

function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  const baseURL = process.env.BETTER_AUTH_URL?.trim()
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  if (!secret || secret.length < 32 || !baseURL) {
    throw new Error("Set BETTER_AUTH_SECRET and BETTER_AUTH_URL before using authentication.");
  }

  const url = new URL(baseURL);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password
    || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("BETTER_AUTH_URL must be the application origin.");
  }

  return betterAuth({
    appName: "Shoe Beta",
    baseURL: url.origin,
    secret,
    database: prismaAdapter(getDb(), { provider: "postgresql", transaction: true }),
    emailAndPassword: { enabled: true },
  });
}

export function getAuth() {
  return auth ??= createAuth();
}
