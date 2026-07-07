import type { StorybookConfig } from "@storybook/react-vite";
import path from "node:path";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-essentials"],
  framework: { name: "@storybook/react-vite", options: {} },
  core: { disableTelemetry: true },
  // 沿用 app 的 @ alias（Storybook 不讀 vite.config 的 resolve.alias）
  viteFinal: async (cfg) => {
    cfg.resolve = cfg.resolve ?? {};
    cfg.resolve.alias = { ...(cfg.resolve.alias ?? {}), "@": path.resolve(process.cwd(), "src") };
    return cfg;
  },
};

export default config;
