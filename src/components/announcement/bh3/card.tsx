import type { ReactNode } from "react";
import type { AnnouncementItem } from "#/types/announcement";
import { ossProcessWebp } from "#/utils/image-processing";
import { Bh3AnnouncementModal } from "./modal";

export function Bh3AnnouncementCard({ item, priority = false, children }: { item: AnnouncementItem; priority?: boolean; children: ReactNode }) {
  return (
    <Bh3AnnouncementModal item={item}>
      <div className="aspect-[774/160]">
        <img className="rounded" src={ossProcessWebp(item.image)} alt={item.title} fetchPriority={priority ? "high" : "auto"} />
      </div>
      <div className="announcement-card-details">
        <p>{item.title}</p>
        {children}
      </div>
    </Bh3AnnouncementModal>
  );
}
