import type { AnnouncementResponse } from "#/types/announcement";
import { queryOptions } from "@tanstack/react-query";
import { getBh3Announcement } from "#/utils/announcements.functions";

export function bh3AnnouncementQueryOptions() {
  return queryOptions({
    queryKey: ["announcement", "bh3"],
    queryFn: async ({ signal }): Promise<AnnouncementResponse> => {
      if (typeof window === "undefined") {
        return getBh3Announcement();
      }
      const response = await fetch("/api/announcement/bh3", { signal });
      if (!response.ok) {
        throw new Error(`获取失败: ${response.status} ${response.statusText}`);
      }
      return response.json() as Promise<AnnouncementResponse>;
    },
    staleTime: 60_000,
  });
}
