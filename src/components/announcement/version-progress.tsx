import type { AnnouncementProgress } from "#/types/announcement";
import { appendAnnotation } from "#/utils/format-annotation";
import { Progress } from "../ui/progress";

export function AnnouncementVersionProgress({ progress }: { progress: AnnouncementProgress }) {
  if (!progress.percent) {
    return null;
  }
  return (
    <div className="my-4">
      <Progress value={progress.percent * 100} aria-label="当前版本进度" />
      <span>
        {progress.start_time}
        {" ~ "}
        {appendAnnotation(progress.end_time, progress.end_time_humanize)}
      </span>
    </div>
  );
}
