export function AnnouncementError({ error }: { error: Error }) {
  return (
    <div className="my-4">
      <span>获取失败</span>
      <pre><code>{String(error)}</code></pre>
    </div>
  );
}
