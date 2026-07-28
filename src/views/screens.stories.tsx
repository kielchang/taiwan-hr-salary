import type { Meta, StoryObj } from "@storybook/react";
import { DashboardView } from "@/views/DashboardView";
import { MasterDataView } from "@/views/MasterDataView";
import { MonthlyView } from "@/views/MonthlyView";
import { ReviewView } from "@/views/ReviewView";
import { ReportsHubView } from "@/views/ReportsHubView";
import { AnalyticsView } from "@/views/AnalyticsView";
import { ProjectsView } from "@/views/ProjectsView";
import { AttendanceView } from "@/views/AttendanceView";
import { FilingView } from "@/views/FilingView";
import { SettingsView } from "@/views/SettingsView";
import { SetupWizard } from "@/views/SetupWizard";
import { HelpView } from "@/views/HelpView";

// 完整畫面（讀取 store 內建 62 人示範公司；Router 由 preview decorator 提供）。
const meta: Meta = {
  title: "畫面/整頁",
  parameters: { layout: "fullscreen" },
};
export default meta;
type S = StoryObj;

const wrap = (node: React.ReactNode): S => ({ render: () => <div className="mx-auto max-w-[1120px]">{node}</div> });

export const 工作台_Dashboard: S = wrap(<DashboardView />);
export const 基本資料_MasterData: S = wrap(<MasterDataView />);
export const 薪資結算_Monthly: S = wrap(<MonthlyView showPeriodPicker />);
export const 查核與確認_Review: S = wrap(<ReviewView />);
export const 報表與申報_Reports: S = wrap(<ReportsHubView />);
export const 薪酬分析_Analytics: S = wrap(<AnalyticsView />);
export const 專案_Projects: S = wrap(<ProjectsView />);
export const 出勤打卡_Attendance: S = wrap(<AttendanceView />);
export const 法規申報_Filing: S = wrap(<FilingView />);
export const 系統設定_Settings: S = wrap(<SettingsView />);
export const 使用說明_Help: S = wrap(<HelpView />);
export const 初始設定精靈_Setup: S = wrap(<SetupWizard onDone={() => {}} />);
