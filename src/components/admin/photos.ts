import { PHOTOS_BUCKET, supabase } from "@/lib/supabase";

// Lado más largo, en píxeles, con el que se guardan las fotos.
const MAX_SIDE = 1600;

// Forma (ancho / alto) de la foto en la tarjeta de la tienda: .card-art en
// src/styles/catalog.css (aspect-ratio 1 / .88). El recortador del panel
// encuadra las fotos de productos con esta forma.
export const CARD_PHOTO_ASPECT = 1 / 0.88;

// Parte de la foto que se queda, en píxeles de la foto original.
export type CropArea = { x: number; y: number; width: number; height: number };

// Dibuja la foto (o solo la parte elegida) achicada a 1600 px como mucho y
// la devuelve como JPG. Una foto de celular pesa varios MB y la web no
// necesita tanto.
async function toJpeg(source: Blob, area?: CropArea): Promise<Blob> {
  const bitmap = await createImageBitmap(source);
  const { x, y, width, height } = area ?? { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; // fondo blanco para imágenes con transparencia
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, x, y, width, height, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo procesar la imagen"))),
      "image/jpeg",
      0.86,
    ),
  );
}

// Recorta una foto (lo que se eligió en el recortador) y la deja lista para subir.
export function cropPhoto(source: Blob, area: CropArea): Promise<Blob> {
  return toJpeg(source, area);
}

// Guarda una foto en Storage, dentro de la carpeta indicada, y devuelve su
// ubicación. Lanza un error si algo falla. Si `ready` es true, la foto ya
// viene recortada y achicada (de cropPhoto) y no se vuelve a procesar.
export async function storePhoto(file: Blob, folder: string, ready = false): Promise<string> {
  const path = `${folder}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(path, ready ? file : await toJpeg(file), { contentType: "image/jpeg" });
  if (error) throw new Error(error.message);
  return path;
}

// Baja una foto ya subida, para volver a recortarla.
export async function downloadPhoto(path: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from(PHOTOS_BUCKET).download(path);
  if (error) throw new Error(error.message);
  return data;
}

// Cambia una foto ya subida por otra (la recortada): sube la nueva, apunta
// la fila de product_media a ella y recién ahí borra la vieja. Va con un
// nombre nuevo para que nadie vea la vieja guardada en caché.
export async function replacePhoto(mediaId: number, oldPath: string, photo: Blob) {
  const folder = oldPath.split("/").slice(0, -1).join("/");
  const path = await storePhoto(photo, folder, true);
  const { error } = await supabase.from("product_media").update({ path }).eq("id", mediaId);
  if (error) {
    await supabase.storage.from(PHOTOS_BUCKET).remove([path]);
    throw new Error(error.message);
  }
  await supabase.storage.from(PHOTOS_BUCKET).remove([oldPath]);
}

// Sube una foto y la anota como perteneciente a un producto (y, si se
// indica, a uno de sus diseños). `ready`: ya viene recortada (cropPhoto).
export async function uploadPhoto(file: Blob, productId: number, designId: number | null, sortOrder: number, ready = false) {
  // 1) el archivo va a Storage, en una carpeta con el número del producto
  const path = await storePhoto(file, String(productId), ready);
  // 2) se anota en la tabla a qué producto y diseño pertenece
  const { error } = await supabase
    .from("product_media")
    .insert({ product_id: productId, design_id: designId, kind: "image", path, sort_order: sortOrder });
  if (error) throw new Error(error.message);
}
