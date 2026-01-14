import path from "path";
import os from "os";

const DEFAULT_BASE =
  os.platform() === "win32"
    ? "D:/AceyLibrary"
    : path.join(os.homedir(), "acey_library");

export const ACEY_BASE_PATH =
  process.env.ACEY_LIBRARY_PATH || DEFAULT_BASE;

export const ACEY_STORAGE_PATHS = {
  base: ACEY_BASE_PATH,
  datasets: path.join(ACEY_BASE_PATH, "datasets"),
  audio: path.join(ACEY_BASE_PATH, "audio"),
  images: path.join(ACEY_BASE_PATH, "images"),
  models: path.join(ACEY_BASE_PATH, "models"),
  logs: path.join(ACEY_BASE_PATH, "logs"),
  archive: path.join(ACEY_BASE_PATH, "archive"),
};
