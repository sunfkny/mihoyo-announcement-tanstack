import type { AnnouncementResponse } from "#/types/announcement";
import { AnnouncementCard } from "../card";
import { AnnouncementVersionProgress } from "../version-progress";

export function Hk4eAnnouncementPage({ data }: { data: AnnouncementResponse }) {
  return (
    <div>
      <AnnouncementVersionProgress progress={data.progress} />
      {data.gacha_info.map((item, index) => (
        <AnnouncementCard key={item.ann_id} game="hk4e" item={item} priority={index === 0} />
      ))}
    </div>
  );
}
