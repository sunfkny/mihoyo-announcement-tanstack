import type { AnnouncementItem } from "#/types/announcement";
import { createFileRoute } from "@tanstack/react-router";
import { Bh3AnnouncementPage } from "#/components/announcement/bh3/page";
import { AnnouncementError } from "#/components/announcement/error";
import { getTimeHumanize } from "#/server/lib/datetime";
import { bh3AnnouncementQueryOptions } from "#/utils/bh3-announcement.query";
import { fetchBh3Ocr } from "#/utils/bh3-ocr";

export const Route = createFileRoute("/announcement/bh3")({
  staticData: { game: "bh3" },
  loader: async ({ context, abortController }) => {
    const data = await context.queryClient.query({ ...bh3AnnouncementQueryOptions(), staleTime: "static" });
    const missingTimeItems = data.gacha_info.filter((item) => {
      const hasStartTime = Boolean(item.start_time || item.start_time_humanize);
      const hasEndTime = Boolean(item.end_time || item.end_time_humanize);
      return !hasStartTime || !hasEndTime;
    });
    const missingTimeIds = missingTimeItems.map(item => item.ann_id);
    const times = loadAnnouncementTimes(data.gacha_info, missingTimeIds, abortController.signal);
    return { data, times, missingTimeIds };
  },
  head: () => ({
    meta: [{ title: "崩坏3卡池 - Mihoyo Announcement" }],
    links: [
      {
        rel: "preload",
        href: "https://webstatic.mihoyo.com/bh3/upload/announcement/font/zh-cn.ttf",
        as: "font",
        type: "font/ttf",
        crossOrigin: "anonymous",
      },
    ],
  }),
  errorComponent: AnnouncementError,
  component: AnnouncementRoute,
});

async function loadAnnouncementTimes(items: AnnouncementItem[], annIds: number[], signal: AbortSignal) {
  if (annIds.length === 0) {
    return { items, failed: false };
  }

  try {
    const ocr = await fetchBh3Ocr(annIds, signal);
    const resolvedItems = items.map((item) => {
      const extracted = ocr.gacha_info.find(result => result.ann_id === item.ann_id);
      if (!extracted) {
        return item;
      }

      const startTime = extracted.start_time ?? item.start_time;
      const endTime = extracted.end_time ?? item.end_time;
      let startAnnotation = extracted.start_time_humanize ?? item.start_time_humanize;
      let endAnnotation = extracted.end_time_humanize ?? item.end_time_humanize;
      if (extracted.start_time) {
        startAnnotation = getTimeHumanize(extracted.start_time);
      }
      if (extracted.end_time) {
        endAnnotation = getTimeHumanize(extracted.end_time);
      }

      return {
        ...item,
        start_time: startTime,
        end_time: endTime,
        start_time_humanize: startAnnotation,
        end_time_humanize: endAnnotation,
      };
    });
    return { items: resolvedItems, failed: false };
  } catch {
    return { items, failed: true };
  }
}

function AnnouncementRoute() {
  return <Bh3AnnouncementPage {...Route.useLoaderData()} />;
}
