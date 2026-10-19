import { createServerFn } from "@tanstack/react-start";
import { getNapInfo } from "#/server/services/nap";

export const getNapAnnouncement = createServerFn({ method: "GET" }).handler(() => getNapInfo());
