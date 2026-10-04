import type { Worker } from "tesseract.js";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { imageSize } from "image-size";
import { createWorker } from "tesseract.js";

const require = createRequire(import.meta.url);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

async function downloadImage(url: string) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== "sdk-webstatic.mihoyo.com") {
    throw new Error("Unsupported announcement image host");
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000), redirect: "error" });
  if (!response.ok || !response.body) {
    throw new Error(`Announcement image request failed: ${response.status}`);
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      size += value.byteLength;
      if (size > MAX_IMAGE_BYTES) {
        throw new Error("Announcement image exceeds size limit");
      }
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  return Buffer.concat(chunks);
}

async function recognizeImage(url: string, jobId: string): Promise<string | null> {
  const started = Date.now();
  const image = await downloadImage(url);
  const { width, height } = imageSize(image);
  if (width * height > 12_000_000) {
    throw new Error("Announcement image exceeds pixel limit");
  }
  console.info("[announcement-ocr] downloaded", { jobId, url, bytes: image.length, width, height, downloadMs: Date.now() - started });
  let worker: Worker | undefined;
  let expired = false;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const operation = async () => {
    const initializingAt = Date.now();
    const initialized = await createWorker("chi_sim", 1, {
      workerPath: require.resolve("tesseract.js/src/worker-script/node/index.js"),
      langPath: join(dirname(require.resolve("@tesseract.js-data/chi_sim")), "4.0.0_best_int"),
      cacheMethod: "none",
      errorHandler: () => {},
    });
    if (expired) {
      await initialized.terminate();
      return null;
    }
    worker = initialized;
    console.info("[announcement-ocr] worker-ready", { jobId, url, initializeMs: Date.now() - initializingAt });
    const recognizingAt = Date.now();
    const { data } = await worker.recognize(image, {
      rectangle: { top: 0, left: 0, width: Math.ceil(width * 0.35), height },
    });
    const accepted = data.confidence >= 70;
    console.info("[announcement-ocr] recognized", {
      jobId,
      url,
      recognizeMs: Date.now() - recognizingAt,
      confidence: data.confidence,
      accepted,
    });
    return accepted ? data.text : null;
  };
  try {
    return await Promise.race([
      operation(),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => {
          expired = true;
          reject(new Error("Announcement OCR timed out"));
        }, 20_000);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
    await worker?.terminate();
    console.info("[announcement-ocr] finished", { jobId, url, totalMs: Date.now() - started, timedOut: expired });
  }
}

export async function getAnnouncementImageText(url: string): Promise<string | null> {
  const jobId = randomUUID();
  const started = Date.now();
  console.info("[announcement-ocr] started", { jobId, url });
  try {
    return await recognizeImage(url, jobId);
  } catch (error) {
    console.warn("[announcement-ocr] failed", { jobId, url, elapsedMs: Date.now() - started, error });
    return null;
  }
}
