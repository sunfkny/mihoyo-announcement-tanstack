import type { AnnouncementItem } from "#/types/announcement";
import { appendAnnotation } from "#/utils/format-annotation";
import { ossProcessWebp } from "#/utils/image-processing";
import { Hk4eAnnouncementModal } from "./modal";

export function Hk4eAnnouncementCard({ item, priority = false }: { item: AnnouncementItem; priority?: boolean }) {
  return (
    <Hk4eAnnouncementModal item={item}>
      <div className="aspect-[1080/533]">
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
    </Hk4eAnnouncementModal>
  );
}
