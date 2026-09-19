export type Player = {
  id: number;
  slug: string;
}

export type PlayerUrlEssentials = Pick<Player, "id" | "slug">;