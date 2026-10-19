import type { AnnouncementItem } from "#/types/announcement";
import { appendAnnotation } from "#/utils/format-annotation";
import { ossProcessWebp } from "#/utils/image-processing";
import { NapAnnouncementModal } from "./modal";

export function NapAnnouncementCard({ item, priority = false }: { item: AnnouncementItem; priority?: boolean }) {
  return (
    <NapAnnouncementModal item={item}>
      {item.images?.map((image, index) => (
        <div key={`${item.ann_id}-${image}`} className="aspect-[1590/222]">
          <img src={ossProcessWebp(image)} alt={image} fetchPriority={priority && index === 0 ? "high" : "auto"} />
        </div>
      ))}
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
    </NapAnnouncementModal>
  );
}
