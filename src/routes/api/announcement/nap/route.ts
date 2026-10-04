import { createFileRoute } from "@tanstack/react-router";
import { getNapInfo } from "#/server/services/nap";
import { announcementCacheControl } from "#/utils/announcements.server";

export const Route = createFileRoute("/api/announcement/nap")({
  server: {
    handlers: {
      GET: async () => {
        const data = await getNapInfo();
        return Response.json(data, {
          headers: {
            "CDN-Cache-Control": announcementCacheControl,
          },
        });
      },
    },
  },
});
