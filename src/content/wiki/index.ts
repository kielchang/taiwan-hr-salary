// 操作手冊章節註冊表（有序）。section id＝深連結契約，見 types.ts。
import { ch_quickstart } from "./ch1-quickstart";
import { ch_concepts } from "./ch2-concepts";
import { ch_monthly } from "./ch3-monthly";
import { ch_master } from "./ch4-master";
import { ch_reports } from "./ch5-reports";
import { ch_analytics } from "./ch6-analytics";
import { ch_settings } from "./ch7-settings";
import { ch_calc } from "./ch8-calc";
import type { WikiChapter } from "./types";
export type { WikiChapter, WikiSection, WikiAction } from "./types";
export const WIKI_CHAPTERS: WikiChapter[] = [ch_quickstart, ch_concepts, ch_monthly, ch_master, ch_reports, ch_analytics, ch_settings, ch_calc];
export const DEFAULT_CHAPTER = WIKI_CHAPTERS[0].id;
