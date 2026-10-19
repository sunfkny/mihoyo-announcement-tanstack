import type { MouseEvent, ReactNode } from "react";
import type { AnnouncementItem } from "#/types/announcement";
import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/ui/dialog";
import { resolveTimeAndResetFontSize } from "#/utils/announcement-html";

export function NapAnnouncementModal({
  item,
  children,
}: {
  item: AnnouncementItem;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  function handleTriggerClick(event: MouseEvent) {
    const selection = document.getSelection();
    if (!selection || !selection.isCollapsed) {
      event.preventDefault();
    }
  }

  const html = open ? resolveTimeAndResetFontSize(item.content) : "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={handleTriggerClick}>
        <div
          role="button"
          tabIndex={0}
          aria-label={`查看公告：${item.title}`}
          className="announcement-card"
          data-game="nap"
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setOpen(true);
            }
          }}
        >
          {children}
        </div>
      </DialogTrigger>
      <DialogContent className="border-2 border-[#929292] bg-[#050505] text-white sm:max-w-5xl use-nap-font" aria-describedby={undefined}>
        <DialogHeader className="border-neutral-800">
          <DialogTitle className="text-white">{item.title}</DialogTitle>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="关闭"
              className="text-white"
            >
              <X className="size-5" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <DialogBody>
          <div className="max-h-[calc(100vh-14rem)] min-h-4 nap-content use-nap-font scroll-nap pr-2 overflow-y-auto">

            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
