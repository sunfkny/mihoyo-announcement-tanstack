import type { AnnouncementResponse } from "#/types/announcement";
import { AnnouncementCard } from "../card";
import { AnnouncementVersionProgress } from "../version-progress";

export function NapAnnouncementPage({ data }: { data: AnnouncementResponse }) {
  return (
    <div>
      <AnnouncementVersionProgress progress={data.progress} />
      {data.gacha_info.map((item, index) => (
        <AnnouncementCard key={item.ann_id} game="nap" item={item} priority={index === 0} />
      ))}
    </div>
  );
}
