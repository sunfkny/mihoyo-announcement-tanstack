import { createFileRoute } from "@tanstack/react-router";
import { getBh3Info } from "#/server/services/bh3";
import { announcementCacheControl } from "#/utils/announcements.server";

export const Route = createFileRoute("/api/announcement/bh3")({
  server: {
    handlers: {
      GET: async () => {
        const data = await getBh3Info();
        return Response.json(data, {
          headers: {
            "CDN-Cache-Control": announcementCacheControl,
          },
        });
      },
    },
  },
});
