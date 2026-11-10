import { getAuth } from "@/lib/auth";

async function handleAuth(request: Request) {
  try {
    return await getAuth().handler(request);
  } catch {
    return Response.json({ error: "Authentication is unavailable." }, { status: 503 });
  }
}

export { handleAuth as GET, handleAuth as POST };
