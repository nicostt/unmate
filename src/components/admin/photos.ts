import { PHOTOS_BUCKET, supabase } from "@/lib/supabase";

// Lado más largo, en píxeles, con el que se guardan las fotos.
const MAX_SIDE = 1600;

// Achica la foto antes de subirla: una foto de celular pesa varios MB y la
// web no necesita tanto. Queda como JPG de hasta 1600 px.
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; // fondo blanco para imágenes con transparencia
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo procesar la imagen"))),
      "image/jpeg",
      0.85,
    ),
  );
}

// Guarda una foto en Storage, dentro de la carpeta indicada, y devuelve su
// ubicación. Lanza un error si algo falla.
export async function storePhoto(file: File, folder: string): Promise<string> {
  const path = `${folder}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(path, await shrink(file), { contentType: "image/jpeg" });
  if (error) throw new Error(error.message);
  return path;
}

// Sube una foto y la anota como perteneciente a un producto (y, si se
// indica, a uno de sus diseños).
export async function uploadPhoto(file: File, productId: number, designId: number | null, sortOrder: number) {
  // 1) el archivo va a Storage, en una carpeta con el número del producto
  const path = await storePhoto(file, String(productId));
  // 2) se anota en la tabla a qué producto y diseño pertenece
  const { error } = await supabase
    .from("product_media")
    .insert({ product_id: productId, design_id: designId, kind: "image", path, sort_order: sortOrder });
  if (error) throw new Error(error.message);
}
