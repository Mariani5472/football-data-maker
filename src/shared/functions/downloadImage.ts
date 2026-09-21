import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function downloadImage(
  url: string,
  outputPath: string
) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Erro ao baixar imagem: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, buffer);
  return outputPath;
}