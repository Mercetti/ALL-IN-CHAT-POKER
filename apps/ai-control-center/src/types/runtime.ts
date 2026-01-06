export type RuntimeLog = {
  id: string;
  timestamp: number;
  level: string;
  message: string;
};

export type RuntimeStatus = {
  running: boolean;
  pid: number | null;
  lastLog?: RuntimeLog | null;
  logs?: RuntimeLog[];
};
