import type { ReactNode } from "react";
import type { AnnouncementItem } from "#/types/announcement";
import type { Game } from "#/utils/games";
import { appendAnnotation } from "#/utils/format-annotation";
import { ossProcessWebp } from "#/utils/image-processing";
import { AnnouncementModal } from "./modal";

const imageAspectClasses: Record<Game, string> = {
  bh3: "aspect-[774/160]",
  hk4e: "aspect-[1080/533]",
  hkrpg: "aspect-[1120/340]",
  nap: "aspect-[1590/222]",
};

export function AnnouncementCard({
  game,
  item,
  priority = false,
  children,
}: {
  game: Game;
  item: AnnouncementItem;
  priority?: boolean;
  children?: ReactNode;
}) {
  return (
    <AnnouncementModal game={game} item={item}>
      {game === "nap"
        ? item.images?.map((image, index) => (
            <div key={`${item.ann_id}-${image}`} className={imageAspectClasses.nap}>
              <img src={ossProcessWebp(image)} alt={image} fetchPriority={priority && index === 0 ? "high" : "auto"} />
            </div>
          ))
        : (
            <div className={imageAspectClasses[game]}>
              <img
                className={game === "bh3" ? "rounded" : undefined}
                src={ossProcessWebp(item.image)}
                alt={item.title}
                fetchPriority={priority ? "high" : "auto"}
              />
            </div>
          )}
      <div className="announcement-card-details">
        <p>{item.title}</p>
        {children ?? (
          <>
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
          </>
        )}
      </div>
    </AnnouncementModal>
  );
}
