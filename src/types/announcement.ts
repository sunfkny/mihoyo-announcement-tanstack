export interface AnnouncementProgress {
  start_time: string | null;
  end_time: string | null;
  end_time_humanize: string | null;
  percent: number | null;
}

export interface AnnouncementItem {
  ann_id: number;
  title: string;
  image: string;
  images?: string[];
  content: string;
  start_time: string | null;
  end_time: string | null;
  start_time_humanize: string | null;
  end_time_humanize: string | null;
}

export interface AnnouncementResponse {
  progress: AnnouncementProgress;
  gacha_info: AnnouncementItem[];
}

export type AnnouncementOcrItem = Pick<AnnouncementItem, "ann_id" | "start_time" | "end_time" | "start_time_humanize" | "end_time_humanize">;

export interface AnnouncementOcrResponse {
  gacha_info: AnnouncementOcrItem[];
}
