import checkDiskSpace from "check-disk-space";

export async function getStorageHealth(basePath: string) {
  const disk = await checkDiskSpace(basePath);

  const usedPercent =
    ((disk.size - disk.free) / disk.size) * 100;

  return {
    freeGB: +(disk.free / 1e9).toFixed(2),
    totalGB: +(disk.size / 1e9).toFixed(2),
    usedPercent: +usedPercent.toFixed(1),
    warning: usedPercent > 80,
    critical: usedPercent > 90,
  };
}
