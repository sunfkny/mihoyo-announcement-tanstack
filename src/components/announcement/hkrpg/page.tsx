import type { AnnouncementResponse } from "#/types/announcement";
import { HkrpgAnnouncementCard } from "./card";
import { HkrpgAnnouncementVersionProgress } from "./version-progress";

export function HkrpgAnnouncementPage({ data }: { data: AnnouncementResponse }) {
  return (
    <div>
      <HkrpgAnnouncementVersionProgress progress={data.progress} />
      {data.gacha_info.map((item, index) => (
        <HkrpgAnnouncementCard key={item.ann_id} item={item} priority={index === 0} />
      ))}
    </div>
  );
}
