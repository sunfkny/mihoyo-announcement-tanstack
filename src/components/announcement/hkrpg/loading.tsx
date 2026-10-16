export function HkrpgAnnouncementLoading() {
  return (
    <div className="w-full" role="status" aria-label="正在加载公告" aria-busy="true">
      <div className="my-4 animate-pulse motion-reduce:animate-none" aria-hidden="true">
        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex h-6 items-center">
          <div className="h-4 w-[500px] max-w-full rounded-sm bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
      {Array.from({ length: 2 }, (_, index) => (
        <div key={index} className="announcement-card pointer-events-none select-none" data-game="hkrpg" aria-hidden="true">
          <div className="aspect-[1120/340] animate-pulse bg-current opacity-10 motion-reduce:animate-none" />
          <div className="announcement-card-details">
            <div className="flex h-6 items-center">
              <div className="h-4 w-3/4 animate-pulse rounded-sm bg-current opacity-20 motion-reduce:animate-none" />
            </div>
            <div className="flex h-6 items-start pt-1">
              <div className="h-4 w-2/3 animate-pulse rounded-sm bg-current opacity-10 motion-reduce:animate-none" />
            </div>
            <div className="flex h-6 items-start pt-1">
              <div className="h-4 w-3/5 animate-pulse rounded-sm bg-current opacity-10 motion-reduce:animate-none" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
