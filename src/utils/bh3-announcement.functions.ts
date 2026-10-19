import { createServerFn } from "@tanstack/react-start";
import { getBh3Info } from "#/server/services/bh3";

export const getBh3Announcement = createServerFn({ method: "GET" }).handler(() => getBh3Info());
