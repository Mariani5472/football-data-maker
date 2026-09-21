import {
  mkdir,
  readFile,
  writeFile,
  access,
} from "node:fs/promises";
import path from "node:path";

export class JsonStorage {
  private rewrite: boolean = true;

  constructor(
    private readonly basePath: string
  ) {}

  getRewrite(): boolean {
    return this.rewrite;
  }

  setRewrite(state: boolean): void {
    this.rewrite = state;
  }

  private getPath(collection: string, id: number | string): string {
    return path.join(this.basePath, collection, `${id}.json`);
  }

  async exists(
    collection: string,
    id: number | string,
  ): Promise<boolean> {
    try {
      await access(this.getPath(collection, id));
      return true;
    } catch {
      return false;
    }
  }

  async save<T>(
    collection: string,
    id: number | string,
    data: T,
  ): Promise<boolean> {
    const filePath = this.getPath(collection, id);

    if (!this.rewrite) {
      const alreadyExists = await this.exists(collection, id,);
      if (alreadyExists) {
        return false;
      }
    }

    await mkdir(path.dirname(filePath), {
      recursive: true,
    });

    await writeFile(
      filePath,
      JSON.stringify(data, null, 2),
      "utf8",
    );

    return true;
  }

  async load<T>(
    collection: string,
    id: number | string,
  ): Promise<T> {
    const filePath = this.getPath(collection, id);

    const content = await readFile(filePath, "utf8");

    return JSON.parse(content) as T;
  }
}