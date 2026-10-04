import type { AnnouncementItem } from "#/types/announcement";
import { appendAnnotation } from "#/utils/format-annotation";

export function Bh3AnnouncementTimes({
  item,
  loading,
  failed,
}: {
  item: AnnouncementItem;
  loading: boolean;
  failed: boolean;
}) {
  const rows = [
    { label: "开始时间:", value: item.start_time, annotation: item.start_time_humanize },
    { label: "结束时间:", value: item.end_time, annotation: item.end_time_humanize },
  ];

  return (
    <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-x-1 leading-6" aria-busy={loading} data-announcement-times={item.ann_id}>
      {rows.map(({ label, value, annotation }) => (
        <div key={label} className="col-span-2 grid min-h-12 grid-cols-subgrid sm:min-h-6">
          <span>{label}</span>
          <div>
            {value || annotation
              ? appendAnnotation(value, annotation)
              : loading
                ? (
                    <>
                      <span className="sr-only">加载中</span>
                      <span aria-hidden="true" className="mt-1 block h-4 w-full max-w-72 animate-pulse rounded-sm bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />
                      <span aria-hidden="true" className="mt-2 block h-4 w-32 max-w-full animate-pulse rounded-sm bg-gray-200 motion-reduce:animate-none sm:hidden dark:bg-gray-700" />
                    </>
                  )
                : <span className="text-gray-500 dark:text-gray-400">{failed ? "识别失败" : "暂无时间"}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
