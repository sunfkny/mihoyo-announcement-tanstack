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

export function Bh3AnnouncementModal({
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

  const html = open ? item.content : "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={handleTriggerClick}>
        <div
          role="button"
          tabIndex={0}
          aria-label={`查看公告：${item.title}`}
          className="announcement-card"
          data-game="bh3"
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
      <DialogContent className="border-transparent bg-[#003366] text-white sm:max-w-3xl use-bh3-font" aria-describedby={undefined}>
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
          <div className="max-h-[calc(100vh-14rem)] min-h-4 bh3-content use-bh3-font scroll-bh3 pr-4 overflow-y-scroll">
            <img src={item.image} alt="" className="mb-4 w-full" />
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
