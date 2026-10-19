import { createServerFn } from "@tanstack/react-start";
import { getHk4eInfo } from "#/server/services/hk4e";

export const getHk4eAnnouncement = createServerFn({ method: "GET" }).handler(() => getHk4eInfo());
