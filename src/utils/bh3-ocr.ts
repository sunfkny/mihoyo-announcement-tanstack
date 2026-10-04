import type { AnnouncementOcrResponse } from "#/types/announcement";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";

const getOcrUrl = createIsomorphicFn()
  .server(() => new URL("/api/announcement/bh3/ocr", getRequestUrl()).href)
  .client(() => "/api/announcement/bh3/ocr");

export async function fetchBh3Ocr(annIds: number[], signal?: AbortSignal): Promise<AnnouncementOcrResponse> {
  const ids = [...new Set(annIds)].sort((a, b) => a - b);
  const url = getOcrUrl();
  const results: AnnouncementOcrResponse[] = [];
  for (let offset = 0; offset < ids.length; offset += 8) {
    const response = await fetch(`${url}?ann_id=${ids.slice(offset, offset + 8).join(",")}`, { signal });
    if (!response.ok) {
      throw new Error(`图片时间识别失败: ${response.status}`);
    }
    results.push(await response.json() as AnnouncementOcrResponse);
  }
  return { gacha_info: results.flatMap(result => result.gacha_info) };
}
