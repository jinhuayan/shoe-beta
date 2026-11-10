import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { putPhoto, getPhoto, deletePhoto } from "@/lib/photo-storage";
import { maxPhotoSize, photoType } from "@/lib/photo-validation";

const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const unavailable = () => Response.json({ error: "Photos are unavailable. Please try again." }, { status: 503, headers });

async function handlePhoto(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers, query: { disableCookieCache: true } });
    if (!session) return Response.json({ error: "Sign in to use photos." }, { status: 401, headers });
    if (request.method !== "GET" && request.headers.get("origin") !== auth.options.baseURL) {
      return Response.json({ error: "Invalid request origin." }, { status: 403, headers });
    }
    const { id } = await params;
    const db = getDb();
    const record = await db.fitRecord.findFirst({ where: { id, userId: session.user.id }, select: { photo: true } });
    if (!record) return Response.json({ error: "Fit record not found." }, { status: 404, headers });
    const photo = record.photo;
    if (request.method === "GET") {
      if (!photo) return Response.json({ error: "Photo not found." }, { status: 404, headers });
      const bytes = await getPhoto(photo.objectKey);
      const disposition = new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline";
      return new Response(Buffer.from(bytes), { headers: { ...headers, "Content-Type": photo.contentType, "Content-Disposition": `${disposition}; filename="fit-photo.${photo.contentType === "image/png" ? "png" : "jpg"}"` } });
    }
    if (request.method === "DELETE") {
      if (!photo) return Response.json({ error: "Photo not found." }, { status: 404, headers });
      await deletePhoto(photo.objectKey);
      await db.fitPhoto.deleteMany({ where: { recordId: id, objectKey: photo.objectKey } });
      return Response.json({ deleted: true }, { headers });
    }
    if (photo) return Response.json({ error: "Remove the existing photo before uploading another." }, { status: 409, headers });
    if (Number(request.headers.get("content-length")) > maxPhotoSize + 65536) {
      return Response.json({ error: "Use a photo up to 2 MiB." }, { status: 413, headers });
    }
    let data: FormData;
    try { data = await request.formData(); }
    catch { return Response.json({ error: "Submit a photo as multipart form data." }, { status: 400, headers }); }
    const files = data.getAll("photo");
    const file = files[0];
    if (files.length !== 1 || !(file instanceof File) || !file.size) {
      return Response.json({ error: "Choose one JPEG or PNG photo." }, { status: 400, headers });
    }
    if (file.size > maxPhotoSize) return Response.json({ error: "Use a photo up to 2 MiB." }, { status: 413, headers });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const contentType = photoType(bytes, file.type);
    if (!contentType) return Response.json({ error: "Use a JPEG or PNG photo with a matching file type." }, { status: 400, headers });
    const key = `fit-records/${id}/${randomUUID()}.${contentType === "image/png" ? "png" : "jpg"}`;
    try {
      await putPhoto(key, bytes, contentType);
      await db.fitPhoto.create({ data: { recordId: id, objectKey: key, contentType, size: file.size } });
    } catch (error) {
      try { await deletePhoto(key); }
      catch { console.error("Photo upload cleanup failed."); }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return Response.json({ error: "This record already has a photo." }, { status: 409, headers });
      }
      throw error;
    }
    return Response.json({ uploaded: true }, { status: 201, headers });
  } catch {
    return unavailable();
  }
}

export { handlePhoto as GET, handlePhoto as POST, handlePhoto as DELETE };
