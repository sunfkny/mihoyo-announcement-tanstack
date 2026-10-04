import { createServerFn } from "@tanstack/react-start";
import { getBh3Info } from "#/server/services/bh3";
import { getHk4eInfo } from "#/server/services/hk4e";
import { getHkrpgInfo } from "#/server/services/hkrpg";
import { getNapInfo } from "#/server/services/nap";

export const getBh3Announcement = createServerFn({ method: "GET" }).handler(() => getBh3Info());
export const getHk4eAnnouncement = createServerFn({ method: "GET" }).handler(() => getHk4eInfo());
export const getHkrpgAnnouncement = createServerFn({ method: "GET" }).handler(() => getHkrpgInfo());
export const getNapAnnouncement = createServerFn({ method: "GET" }).handler(() => getNapInfo());
