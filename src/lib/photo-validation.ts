export const maxPhotoSize = 2 * 1024 * 1024;

export function photoType(bytes: Uint8Array, declaredType: string): "image/png" | "image/jpeg" | null {
  const png = [137, 80, 78, 71, 13, 10, 26, 10];
  if (declaredType === "image/png" && bytes.length >= 24 && png.every((value, index) => bytes[index] === value)
    && String.fromCharCode(...bytes.slice(12, 16)) === "IHDR") return "image/png";
  if (declaredType === "image/jpeg" && bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    && bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217) return "image/jpeg";
  return null;
}
