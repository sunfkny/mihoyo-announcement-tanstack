import type { AnnouncementOcrItem, AnnouncementOcrResponse } from "#/types/announcement";
import { parseTimeHumanize } from "#/server/lib/datetime";
import { getAnnContent, getAnnList } from "./index";
import { getBh3TimeRange } from "./time-range";

const noCache = { "CDN-Cache-Control": "no-store" };

export function parseAnnouncementIds(value: string): number[] | null {
  const parts = value.split(",");
  if (parts.length > 8 || parts.some(part => !/^\d+$/.test(part))) {
    return null;
  }
  const ids = parts.map(Number);
  if (ids.some(id => !Number.isSafeInteger(id) || id <= 0)) {
    return null;
  }
  return [...new Set(ids)].sort((a, b) => a - b);
}

export async function getBh3OcrResponse(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const ids = parseAnnouncementIds(url.searchParams.get("ann_id") ?? "");
  if (!ids) {
    return Response.json({ error: "ann_id must contain 1–8 positive integer IDs separated by commas" }, { status: 400, headers: noCache });
  }
  const canonical = `?ann_id=${ids.join(",")}`;
  if (url.search !== canonical) {
    return new Response(null, { status: 308, headers: { ...noCache, Location: `${url.pathname}${canonical}` } });
  }
  const started = Date.now();
  console.info("[announcement-ocr-api] started", { annIds: ids });
  try {
    const [list, content] = await Promise.all([getAnnList(), getAnnContent()]);
    const upstreamMs = Date.now() - started;
    const announcements = content.data.list.filter(item => ids.includes(item.ann_id)
      && item.subtitle.includes("补给") && /补给信息|补给规则/.test(item.content));
    const missing = ids.filter(id => !announcements.some(item => item.ann_id === id));
    if (missing.length) {
      return Response.json({ error: "Announcement not found", ann_ids: missing }, { status: 404, headers: noCache });
    }
    const results: AnnouncementOcrItem[] = [];
    for (const id of ids) {
      const item = announcements.find(item => item.ann_id === id)!;
      const reference = list.data.list.flatMap(group => group.list).find(item => item.ann_id === id)?.start_time;
      const range = await getBh3TimeRange(item.content, reference, true);
      const start = parseTimeHumanize(range?.start);
      const end = parseTimeHumanize(range?.end);
      results.push({
        ann_id: id,
        start_time: start.time,
        end_time: end.time,
        start_time_humanize: start.time ? null : start.time_humanize,
        end_time_humanize: end.time ? null : end.time_humanize,
      });
    }
    const complete = results.every(item => (item.start_time || item.start_time_humanize) && item.end_time);
    console.info("[announcement-ocr-api] finished", { annIds: ids, upstreamMs, totalMs: Date.now() - started, complete });
    const data: AnnouncementOcrResponse = { gacha_info: results };
    return Response.json(data, {
      headers: complete
        ? {
            "CDN-Cache-Control": "public, max-age=86400, stale-while-revalidate=86400",
          }
        : noCache,
    });
  } catch (error) {
    console.warn("[announcement-ocr-api] failed", { annIds: ids, totalMs: Date.now() - started, error });
    return Response.json({ error: "Announcement OCR unavailable" }, { status: 502, headers: noCache });
  }
}
