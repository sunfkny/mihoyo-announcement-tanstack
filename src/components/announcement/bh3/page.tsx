import type { AnnouncementItem, AnnouncementResponse } from "#/types/announcement";
import { Await } from "@tanstack/react-router";
import { Suspense } from "react";
import { AnnouncementCard } from "../card";
import { AnnouncementVersionProgress } from "../version-progress";
import { Bh3AnnouncementTimes } from "./times";

export function Bh3AnnouncementPage({ data, times, missingTimeIds }: {
  data: AnnouncementResponse;
  times: Promise<{ items: AnnouncementItem[]; failed: boolean }>;
  missingTimeIds: number[];
}) {
  return (
    <div>
      <AnnouncementVersionProgress progress={data.progress} />
      {data.gacha_info.map((item, index) => (
        <AnnouncementCard key={item.ann_id} game="bh3" item={item} priority={index === 0}>
          <Suspense fallback={<Bh3AnnouncementTimes item={item} loading={missingTimeIds.includes(item.ann_id)} failed={false} />}>
            <Await promise={times}>
              {({ items, failed }) => <Bh3AnnouncementTimes item={items[index]} loading={false} failed={failed} />}
            </Await>
          </Suspense>
        </AnnouncementCard>
      ))}
    </div>
  );
}
