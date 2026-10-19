import type { AnnouncementItem } from "#/types/announcement";
import { appendAnnotation } from "#/utils/format-annotation";
import { ossProcessWebp } from "#/utils/image-processing";
import { HkrpgAnnouncementModal } from "./modal";

export function HkrpgAnnouncementCard({ item, priority = false }: { item: AnnouncementItem; priority?: boolean }) {
  return (
    <HkrpgAnnouncementModal item={item}>
      <div className="aspect-[1120/340]">
        <img src={ossProcessWebp(item.image)} alt={item.title} fetchPriority={priority ? "high" : "auto"} />
      </div>
      <div className="announcement-card-details">
        <p>{item.title}</p>
        <p>
          开始时间:
          {" "}
          {appendAnnotation(item.start_time, item.start_time_humanize)}
        </p>
        <p>
          结束时间:
          {" "}
          {appendAnnotation(item.end_time, item.end_time_humanize)}
        </p>
      </div>
    </HkrpgAnnouncementModal>
  );
}
