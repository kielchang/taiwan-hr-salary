// 內容用「開啟系統畫面」連結：依部署環境的 appUrl（customFields）組 HashRouter 網址，開新分頁。
// 用法（.md 內直接可用，經 theme/MDXComponents 全域註冊）：<AppLink to="/payroll/monthly">前往薪資結算</AppLink>
import React from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

export default function AppLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { siteConfig } = useDocusaurusContext();
  const appUrl = (siteConfig.customFields?.appUrl as string) ?? "https://kielchang.github.io/taiwan-hr-salary/";
  const href = `${appUrl.replace(/\/$/, "")}/#${to}`;
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children} ↗
    </a>
  );
}
