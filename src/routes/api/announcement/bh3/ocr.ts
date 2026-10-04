import { createFileRoute } from "@tanstack/react-router";
import { getBh3OcrResponse } from "#/server/services/bh3/ocr";

export const Route = createFileRoute("/api/announcement/bh3/ocr")({
  server: {
    handlers: {
      GET: ({ request }) => getBh3OcrResponse(request),
    },
  },
});
