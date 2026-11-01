import raw from "../app-config.json";
import type { OutputConfig } from "./contracts";
export const config = raw as OutputConfig & { appId: string };
