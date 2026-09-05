import { z } from "zod";
const imageReferenceSchema = z.string().max(3 * 1024 * 1024).refine((value) => {
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return !!url.hostname;
    } catch {
      return false;
    }
  }
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return false;
  const bytes = Buffer.from(match[2], "base64");
  if (match[1] === "jpeg") return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (match[1] === "png") return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
}, "Choose a valid JPEG, PNG or WebP image, or an HTTP(S) image URL").nullable().optional();
export {
  imageReferenceSchema
};
