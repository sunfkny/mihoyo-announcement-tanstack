import type { AnnouncementResponse } from "#/types/announcement";
import { queryOptions } from "@tanstack/react-query";
import { getNapAnnouncement } from "#/utils/announcements.functions";

export function napAnnouncementQueryOptions() {
  return queryOptions({
    queryKey: ["announcement", "nap"],
    queryFn: async ({ signal }): Promise<AnnouncementResponse> => {
      if (typeof window === "undefined") {
        return getNapAnnouncement();
      }
      const response = await fetch("/api/announcement/nap", { signal });
      if (!response.ok) {
        throw new Error(`获取失败: ${response.status} ${response.statusText}`);
      }
      return response.json() as Promise<AnnouncementResponse>;
    },
    staleTime: 60_000,
  });
}
