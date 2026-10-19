export function createAnnouncement(content: string, title: string, annId = 1) {
  return {
    ann_id: annId,
    title,
    subtitle: title,
    content,
    banner: "https://example.com/banner.png",
    img: "https://example.com/banner.png",
    lang: "zh-cn",
    remind_text: "",
    content_type: 1,
    href_type: 0,
    href: "",
    pic_list: [],
  };
}

export function createContentResponse(content?: string, title = "3.3版本限时频段（上期）") {
  const body = content ?? `<p>本期代理人与音擎调频活动时间为：3.3版本更新后 ~ 2026-10-20 14:59（服务器时间），包含如下内容：</p><p style="font-size: 0.5rem">公告详细说明</p><img src="https://example.com/detail.png">`;
  const announcement = createAnnouncement(body, title);
  const unrelated = createAnnouncement("<p>维护通知</p>", "维护通知", 2);
  return {
    retcode: 0,
    message: "OK",
    data: {
      list: [],
      total: 0,
      pic_list: [unrelated, announcement],
      pic_total: 2,
    },
  };
}

export function createListResponse() {
  const version = {
    ...createAnnouncement("", "版本更新说明", 100),
    type_label: "公告",
    tag_label: "修复/更新",
    tag_icon: "",
    login_alert: 0,
    start_time: "2026-10-01 12:00:00",
    end_time: "2026-11-01 12:00:00",
    type: 1,
    remind: 0,
    alert: 0,
    tag_start_time: "",
    tag_end_time: "",
    remind_ver: 0,
    has_content: true,
    extra_remind: 0,
    tag_icon_hover: "",
    logout_remind: 0,
    logout_remind_ver: 0,
    country: "CN",
    need_remind_text: 0,
    weak_remind: 0,
    remind_consumption_type: 0,
  };
  return {
    retcode: 0,
    message: "OK",
    data: {
      list: [{ list: [version], type_id: 1, type_label: "公告" }],
      total: 1,
      type_list: [],
      alert: false,
      alert_id: 0,
      timezone: 8,
      t: "",
      pic_list: [],
      pic_total: 0,
      pic_type_list: [],
      pic_alert: false,
      pic_alert_id: 0,
      static_sign: "",
      banner: "",
      calendar_type: { mi18n_name: "", enabled: false, remind: false },
      use_webp: "1",
    },
  };
}

export function createAnnouncementApi(contentResponse = createContentResponse(), listResponse = createListResponse()) {
  return async (path: string) => {
    if (path.endsWith("/getAnnList")) {
      return listResponse;
    }
    if (path.endsWith("/getAnnContent")) {
      return contentResponse;
    }
    throw new Error(`Unexpected announcement request: ${path}`);
  };
}
