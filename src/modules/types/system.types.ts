export type SystemStats = {
  hostname: string;
  platform: string;
  arch: string;
  uptime: {
    os: number;
    process: number;
  };
  cpu: {
    model: string;
    cores: number;
    usage: number;
  };
  memory: {
    totalMB: number;
    usedMB: number;
    freeMB: number;
    usagePercent: number;
  };
  disk: {
    totalGB: number;
    usedGB: number;
    freeGB: number;
    usagePercent: number;
  };
  load: number[];
  nodeVersion: string;
  processMemoryMB: number;
};
