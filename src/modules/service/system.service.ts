import os from 'os';
import fs from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { SystemStats } from '@/modules/types';

const execFileAsync = promisify(execFile);

export class SystemService {
  async getStats(): Promise<SystemStats> {
    const [cpuUsage, disk] = await Promise.all([
      this.getCpuUsage(),
      this.getDiskUsage(),
    ]);

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const processMemory = process.memoryUsage();

    return {
      hostname: os.hostname(),
      platform: `${os.type()} ${os.release()}`,
      arch: os.arch(),
      uptime: {
        os: Math.floor(os.uptime()),
        process: Math.floor(process.uptime()),
      },
      cpu: {
        model: os.cpus()[0]?.model ?? 'unknown',
        cores: os.cpus().length,
        usage: cpuUsage,
      },
      memory: {
        totalMB: toMB(totalMem),
        usedMB: toMB(usedMem),
        freeMB: toMB(freeMem),
        usagePercent: round((usedMem / totalMem) * 100),
      },
      disk,
      load: os.loadavg().map((l) => round(l)),
      nodeVersion: process.version,
      processMemoryMB: toMB(processMemory.rss),
    };
  }

  private getCpuUsage(): Promise<number> {
    const cpus1 = os.cpus();
    return new Promise((resolve) => {
      setTimeout(() => {
        const cpus2 = os.cpus();
        let idleDiff = 0;
        let totalDiff = 0;

        for (let i = 0; i < cpus1.length; i++) {
          const c1 = cpus1[i].times;
          const c2 = cpus2[i].times;
          const idle = c2.idle - c1.idle;
          const total =
            c2.user - c1.user +
            c2.nice - c1.nice +
            c2.sys - c1.sys +
            c2.idle - c1.idle +
            c2.irq - c1.irq;
          idleDiff += idle;
          totalDiff += total;
        }

        const usage = totalDiff === 0 ? 0 : ((totalDiff - idleDiff) / totalDiff) * 100;
        resolve(round(usage));
      }, 200);
    });
  }

  private async getDiskUsage(): Promise<SystemStats['disk']> {
    try {
      const { stdout } = await execFileAsync('df', ['-B1', '--output=size,used,avail', '/']);
      const lines = stdout.trim().split('\n');
      const parts = lines[1].trim().split(/\s+/);
      const total = Number(parts[0]);
      const used = Number(parts[1]);
      const free = Number(parts[2]);

      return {
        totalGB: toGB(total),
        usedGB: toGB(used),
        freeGB: toGB(free),
        usagePercent: round((used / total) * 100),
      };
    } catch {
      // fallback: try reading /proc (works on most Linux systems)
      try {
        const statfs = await fs.statfs('/');
        const total = statfs.bsize * statfs.blocks;
        const free = statfs.bsize * statfs.bfree;
        const used = total - free;

        return {
          totalGB: toGB(total),
          usedGB: toGB(used),
          freeGB: toGB(free),
          usagePercent: round((used / total) * 100),
        };
      } catch {
        return { totalGB: 0, usedGB: 0, freeGB: 0, usagePercent: 0 };
      }
    }
  }
}

function toMB(bytes: number): number {
  return round(bytes / (1024 * 1024));
}

function toGB(bytes: number): number {
  return round(bytes / (1024 * 1024 * 1024));
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
