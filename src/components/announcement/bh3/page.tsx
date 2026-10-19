import type { AnnouncementItem, AnnouncementResponse } from "#/types/announcement";
import { Await } from "@tanstack/react-router";
import { Suspense } from "react";
import { Bh3AnnouncementCard } from "./card";
import { Bh3AnnouncementTimes } from "./times";
import { Bh3AnnouncementVersionProgress } from "./version-progress";

export function Bh3AnnouncementPage({ data, times, missingTimeIds }: {
  data: AnnouncementResponse;
  times: Promise<{ items: AnnouncementItem[]; failed: boolean }>;
  missingTimeIds: number[];
}) {
  return (
    <div>
      <Bh3AnnouncementVersionProgress progress={data.progress} />
      {data.gacha_info.map((item, index) => (
        <Bh3AnnouncementCard key={item.ann_id} item={item} priority={index === 0}>
          <Suspense fallback={<Bh3AnnouncementTimes item={item} loading={missingTimeIds.includes(item.ann_id)} failed={false} />}>
            <Await promise={times}>
              {({ items, failed }) => <Bh3AnnouncementTimes item={items[index]} loading={false} failed={failed} />}
            </Await>
          </Suspense>
        </Bh3AnnouncementCard>
      ))}
    </div>
  );
}
