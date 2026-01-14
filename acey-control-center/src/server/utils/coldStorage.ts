import fs from "fs";
import path from "path";
import archiver from "archiver";

export async function compressToZip(
  sourceDir: string,
  outputZip: string
): Promise<void> {
  if (!fs.existsSync(sourceDir)) return;

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputZip);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`✅ Compressed ${sourceDir} to ${outputZip} (${archive.pointer()} bytes)`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

export async function compressToGzip(
  sourceFile: string,
  outputFile: string
): Promise<void> {
  if (!fs.existsSync(sourceFile)) return;

  const zlib = require('zlib');
  const gzip = zlib.createGzip({ level: 9 });
  const input = fs.createReadStream(sourceFile);
  const output = fs.createWriteStream(outputFile);

  return new Promise((resolve, reject) => {
    output.on('finish', () => {
      console.log(`✅ Compressed ${sourceFile} to ${outputFile}`);
      resolve();
    });

    output.on('error', reject);
    input.on('error', reject);

    input.pipe(gzip).pipe(output);
  });
}

// Default compression policies
export const COMPRESSION_POLICIES = {
  audio: { ageDays: 14, action: 'zip' as const },
  images: { ageDays: 30, action: 'zip' as const },
  datasets: { ageDays: 90, action: 'gzip' as const },
  models: { ageDays: 180, action: 'archive' as const },
};
