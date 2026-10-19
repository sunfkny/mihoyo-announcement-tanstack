import type { AnnouncementResponse } from "#/types/announcement";
import { Hk4eAnnouncementCard } from "./card";
import { Hk4eAnnouncementVersionProgress } from "./version-progress";

export function Hk4eAnnouncementPage({ data }: { data: AnnouncementResponse }) {
  return (
    <div>
      <Hk4eAnnouncementVersionProgress progress={data.progress} />
      {data.gacha_info.map((item, index) => (
        <Hk4eAnnouncementCard key={item.ann_id} item={item} priority={index === 0} />
      ))}
    </div>
  );
}
