import type { PDFDocumentProxy } from "pdfjs-dist";

export const PDF_WORKER_SRC = "/workers/pdf.worker.min.mjs";

/**
 * Dynamically imports pdfjs-dist and configures the self-hosted worker URL.
 */
export async function loadPdfJs() {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
  return pdfjsLib;
}

/**
 * Opens a PDF document from raw bytes, runs `handler`, and guarantees `pdfDoc.destroy()`
 * in a `finally` block so WASM/worker memory is never leaked.
 */
export async function withPdfDocument<T>(
  data: ArrayBuffer | Uint8Array,
  handler: (pdfDoc: PDFDocumentProxy) => Promise<T>
): Promise<T> {
  const pdfjsLib = await loadPdfJs();
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const loadingTask = pdfjsLib.getDocument({ data: bytes });
  const pdfDoc = await loadingTask.promise;
  try {
    return await handler(pdfDoc);
  } finally {
    await pdfDoc.cleanup();
    await loadingTask.destroy();
  }
}

/**
 * Encodes an HTMLCanvasElement via `canvas.toBlob` (instead of memory-heavy base64 data URLs)
 * and zeros out the canvas dimensions immediately afterward to release GPU/bitmap memory.
 */
export async function canvasToBytes(
  canvas: HTMLCanvasElement,
  mimeType = "image/jpeg",
  quality = 0.85
): Promise<Uint8Array> {
  try {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error(`Failed to encode canvas as ${mimeType}`));
          }
        },
        mimeType,
        quality
      );
    });
    const buffer = await blob.arrayBuffer();
    return new Uint8Array(buffer);
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}
