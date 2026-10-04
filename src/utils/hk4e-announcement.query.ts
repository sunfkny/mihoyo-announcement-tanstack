import type { AnnouncementResponse } from "#/types/announcement";
import { queryOptions } from "@tanstack/react-query";
import { getHk4eAnnouncement } from "#/utils/announcements.functions";

export function hk4eAnnouncementQueryOptions() {
  return queryOptions({
    queryKey: ["announcement", "hk4e"],
    queryFn: async ({ signal }): Promise<AnnouncementResponse> => {
      if (typeof window === "undefined") {
        return getHk4eAnnouncement();
      }
      const response = await fetch("/api/announcement/hk4e", { signal });
      if (!response.ok) {
        throw new Error(`获取失败: ${response.status} ${response.statusText}`);
      }
      return response.json() as Promise<AnnouncementResponse>;
    },
    staleTime: 60_000,
  });
}
