import { createFileRoute } from "@tanstack/react-router";
import { getHk4eInfo } from "#/server/services/hk4e";
import { announcementCacheControl } from "#/utils/announcements.server";

export const Route = createFileRoute("/api/announcement/hk4e")({
  server: {
    handlers: {
      GET: async () => {
        const data = await getHk4eInfo();
        return Response.json(data, {
          headers: {
            "CDN-Cache-Control": announcementCacheControl,
          },
        });
      },
    },
  },
});
