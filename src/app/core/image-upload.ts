/** Compresse une photo avant envoi (nginx-proxy refuse souvent > 1 Mo). */
const PROXY_SAFE_BYTES = 900_000;
const MAX_EDGE = 1920;
const MAX_BYTES = 20 * 1024 * 1024;

export async function prepareImageUpload(file: File): Promise<File> {
  if (!file) throw new Error('Aucun fichier reçu');
  if (file.size > MAX_BYTES) throw new Error('Image trop volumineuse (20 Mo maximum).');
  const light = file.size <= PROXY_SAFE_BYTES && /image\/(jpeg|png|gif|webp)/i.test(file.type);
  if (light) return file;

  try {
    const canvas = await drawToCanvas(file);
    const keepPng = file.type === 'image/png' && file.size < 2_000_000;
    let blob = await toBlob(canvas, keepPng ? 'image/png' : 'image/jpeg', 0.84);
    if (blob && blob.size > PROXY_SAFE_BYTES && !keepPng) {
      const tighter = await toBlob(canvas, 'image/jpeg', 0.72);
      if (tighter && tighter.size < blob.size) blob = tighter;
    }
    if (!blob) return file;
    const ext = blob.type === 'image/png' ? '.png' : '.jpg';
    const name = file.name.replace(/\.[^.]+$/, '') + ext;
    return new File([blob], name, { type: blob.type });
  } catch {
    const heic = /\.hei[cf]$/i.test(file.name) || /heic|heif/i.test(file.type);
    if (heic) throw new Error('Photo HEIC non lue. Enregistrez-la en JPEG ou PNG.');
    if (file.size > PROXY_SAFE_BYTES) throw new Error('Impossible de compresser cette image. Utilisez un JPEG plus léger.');
    return file;
  }
}

export function uploadErrorMessage(e: unknown): string {
  const err = e as { status?: number; error?: { message?: string } | string; message?: string };
  if (err?.status === 413) return 'Image trop volumineuse pour le serveur. Réessayez avec un JPEG plus léger.';
  if (err?.status === 401 || err?.status === 403) return 'Session expirée. Reconnectez-vous pour envoyer une image.';
  if (typeof err?.error === 'object' && err.error?.message) return err.error.message;
  if (err?.status === 500) return 'Le serveur n’a pas pu enregistrer l’image. Réessayez.';
  if (err?.message && !String(err.message).startsWith('Http failure')) return err.message;
  return 'Téléversement impossible.';
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality));
}

async function drawToCanvas(file: File): Promise<HTMLCanvasElement> {
  try {
    const bmp = await createImageBitmap(file);
    const canvas = scaledCanvas(bmp.width, bmp.height);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    return canvas;
  } catch {
    const img = await loadImage(file);
    const canvas = scaledCanvas(img.naturalWidth || img.width, img.naturalHeight || img.height);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  }
}

function scaledCanvas(width: number, height: number): HTMLCanvasElement {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height, 1));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  return canvas;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('illisible')); };
    img.src = url;
  });
}
