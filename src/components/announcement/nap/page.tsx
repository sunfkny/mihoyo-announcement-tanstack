import type { AnnouncementResponse } from "#/types/announcement";
import { NapAnnouncementCard } from "./card";
import { NapAnnouncementVersionProgress } from "./version-progress";

export function NapAnnouncementPage({ data }: { data: AnnouncementResponse }) {
  return (
    <div>
      <NapAnnouncementVersionProgress progress={data.progress} />
      {data.gacha_info.map((item, index) => (
        <NapAnnouncementCard key={item.ann_id} item={item} priority={index === 0} />
      ))}
    </div>
  );
}
