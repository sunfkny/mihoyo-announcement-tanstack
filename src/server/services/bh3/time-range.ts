import { Window } from "happy-dom";
import { getAnnouncementImageText } from "#/server/lib/announcement-ocr";
import { formatChineseISOLocaleString, parseLocalDate } from "#/server/lib/datetime";

interface TimeRange {
  start: string;
  end: string;
}

export function normalizeTimeText(text: string) {
  return text.normalize("NFKC").replace(/\([^)]*\)/g, "").replace(/[^\S\r\n]+/g, "");
}

export function parseOcrTimeRange(text: string, reference: string): TimeRange | null {
  const normalized = normalizeTimeText(text);
  if (!normalized.includes("补给时间")) {
    return null;
  }
  const matches = [...normalized.matchAll(/(\d{1,2})月(\d{1,2})日(\d{1,2}):(\d{2})(?!\d)/g)];
  const versionStart = /\d+\.\d+版本更新后/.exec(normalized)?.[0];
  if (matches.length !== 2 && !(matches.length === 1 && versionStart)) {
    return null;
  }
  const referenceDate = parseLocalDate(reference);
  const referenceYear = Number(reference.slice(0, 4));
  if (!Number.isInteger(referenceYear) || referenceYear < 2000) {
    return null;
  }
  const dateFor = (match: RegExpMatchArray, year: number) => {
    const [month, day, hour, minute] = match.slice(1).map(Number);
    const check = new Date(Date.UTC(year, month - 1, day, hour, minute));
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1
      || check.getUTCDate() !== day || check.getUTCHours() !== hour || check.getUTCMinutes() !== minute) {
      return null;
    }
    return parseLocalDate(`${year}年${month}月${day}日${hour}:${String(minute).padStart(2, "0")}`);
  };
  const candidates = [referenceYear - 1, referenceYear, referenceYear + 1]
    .map(year => ({ year, date: dateFor(matches[0], year) }))
    .filter(candidate => candidate.date !== null)
    .sort((a, b) => Math.abs(a.date!.getTime() - referenceDate.getTime()) - Math.abs(b.date!.getTime() - referenceDate.getTime()));
  const start = candidates[0];
  if (!start?.date) {
    return null;
  }
  if (matches.length === 1 && versionStart) {
    return { start: versionStart, end: formatChineseISOLocaleString(start.date) };
  }
  const crossesYear = Number(matches[1][1]) < Number(matches[0][1]);
  const end = dateFor(matches[1], start.year + (crossesYear ? 1 : 0));
  if (!end || end <= start.date || end.getTime() - start.date.getTime() > 90 * 86400_000) {
    return null;
  }
  return { start: formatChineseISOLocaleString(start.date), end: formatChineseISOLocaleString(end) };
}

export async function getBh3TimeRange(content: string, reference?: string, ocr = false): Promise<TimeRange | null> {
  const window = new Window({
    settings: { disableJavaScriptEvaluation: true, disableCSSFileLoading: true, disableJavaScriptFileLoading: true },
  });
  try {
    window.document.body.innerHTML = content;
    const heading = [...window.document.querySelectorAll("h2,h3")].find(element => element.textContent.trim() === "补给信息");
    const images: string[] = [];
    const text = normalizeTimeText(window.document.body.textContent);
    const match = /(?<start>\d+月\d+日\d+:\d+|\d+\.\d+版本更新后)[~～—–至-](?<end>\d+月\d+日\d+:\d+)/.exec(text);
    if (match?.groups) {
      return { start: match.groups.start, end: match.groups.end };
    }
    if (!ocr) {
      return null;
    }

    for (let element = heading?.nextElementSibling; element; element = element.nextElementSibling) {
      if (/^H[1-6]$/.test(element.tagName)) {
        break;
      }
      images.push(...[...element.querySelectorAll("img")].map(image => image.src));
    }
    for (const image of images.slice(0, 2)) {
      const imageReference = reference || /\/upload\/ann\/(\d{4})\/(\d{2})\/(\d{2})\//.exec(image)?.slice(1).join("-");
      if (!imageReference) {
        continue;
      }
      const recognized = await getAnnouncementImageText(image);
      if (recognized) {
        const range = parseOcrTimeRange(recognized, imageReference);
        if (range) {
          return range;
        }
      }
    }
    return null;
  } catch (error) {
    console.warn("Announcement time extraction failed", error);
    return null;
  } finally {
    await window.happyDOM.close();
  }
}
