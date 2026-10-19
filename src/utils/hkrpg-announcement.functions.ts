import { createServerFn } from "@tanstack/react-start";
import { getHkrpgInfo } from "#/server/services/hkrpg";

export const getHkrpgAnnouncement = createServerFn({ method: "GET" }).handler(() => getHkrpgInfo());
