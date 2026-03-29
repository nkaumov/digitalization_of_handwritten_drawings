import type { WarningLevel } from './status';

export interface WarningItem {
  code: string;
  message: string;
  level: WarningLevel;
  source?: string;
}
