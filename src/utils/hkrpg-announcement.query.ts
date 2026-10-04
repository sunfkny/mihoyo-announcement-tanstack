import type { AnnouncementResponse } from "#/types/announcement";
import { queryOptions } from "@tanstack/react-query";
import { getHkrpgAnnouncement } from "#/utils/announcements.functions";

export function hkrpgAnnouncementQueryOptions() {
  return queryOptions({
    queryKey: ["announcement", "hkrpg"],
    queryFn: async ({ signal }): Promise<AnnouncementResponse> => {
      if (typeof window === "undefined") {
        return getHkrpgAnnouncement();
      }
      const response = await fetch("/api/announcement/hkrpg", { signal });
      if (!response.ok) {
        throw new Error(`获取失败: ${response.status} ${response.statusText}`);
      }
      return response.json() as Promise<AnnouncementResponse>;
    },
    staleTime: 60_000,
  });
}
