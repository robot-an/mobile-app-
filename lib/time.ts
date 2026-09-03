// Chuan hoa moi phep so sanh "gio hien tai" trong app ve GIO VIET NAM (Asia/Ho_Chi_Minh, UTC+7)
// thay vi tin vao timezone cua thiet bi/trinh duyet, de bao thuc luon dung gio VN du dien thoai
// dat sai mui gio.
const VIETNAM_TIMEZONE = "Asia/Ho_Chi_Minh";

const WEEKDAY_TO_ISO: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7
};

export interface VietnamNow {
  hhmm: string;      // "08:00"
  weekday: number;   // 1 (Thu 2) .. 7 (Chu nhat), khop voi CareSchedule.days_of_week
}

export function getVietnamNow(date: Date = new Date()): VietnamNow {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: VIETNAM_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short"
  }).formatToParts(date);

  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const weekdayShort = parts.find((p) => p.type === "weekday")?.value ?? "Mon";

  return {
    hhmm: `${hour === "24" ? "00" : hour}:${minute}`,
    weekday: WEEKDAY_TO_ISO[weekdayShort] ?? 1
  };
}
