/**
 * Safe browser utility functions.
 *
 * Centralizes browser-only patterns (URL.createObjectURL, download, audio playback)
 * so they can be reused safely and cleaned up consistently across the studio.
 */

/**
 * Create an object URL from a Blob and return a cleanup function.
 *
 * Usage:
 *   const [url, cleanup] = createObjectUrl(blob);
 *   // use url...
 *   cleanup(); // when done
 */
export function createObjectUrl(blob: Blob): [string, () => void] {
  const url = URL.createObjectURL(blob);
  return [url, () => URL.revokeObjectURL(url)];
}

/**
 * Download a Blob as a file by creating a temporary anchor element.
 * Returns a cleanup function that revokes the object URL.
 */
export function downloadBlob(blob: Blob, filename: string): () => void {
  const [url, cleanup] = createObjectUrl(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return cleanup;
}

/**
 * Format bytes into a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
