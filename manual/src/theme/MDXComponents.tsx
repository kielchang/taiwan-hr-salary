// 全域 MDX 元件：所有 .md/.mdx 免 import 直接可用（Docusaurus v3 .md 預設走 MDX 處理）。
import MDXComponents from "@theme-original/MDXComponents";
import AppLink from "@site/src/components/AppLink";
import StoryFrame from "@site/src/components/StoryFrame";
import FlowPlayer from "@site/src/components/FlowPlayer";
import { DemoEditableField, DemoDelta, DemoStepper, DemoTabPills, DemoCallout, DemoNumberInput } from "@site/src/components/demos";
import { CalcOvertime, CalcLeaveDeduct, CalcBracket, CalcInsurance, CalcSupplementary, CalcTax, CalcPayFactor, CalcEmployerCost, CalcSeniority, CalcValidation } from "@site/src/components/demos/calcs";

export default {
  ...MDXComponents, AppLink, StoryFrame, FlowPlayer,
  DemoEditableField, DemoDelta, DemoStepper, DemoTabPills, DemoCallout, DemoNumberInput,
  CalcOvertime, CalcLeaveDeduct, CalcBracket, CalcInsurance, CalcSupplementary, CalcTax, CalcPayFactor, CalcEmployerCost, CalcSeniority, CalcValidation,
};
