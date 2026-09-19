export type EntityId = {
  id: number;
};

type ApiRequestMap = {
  player: PlayerResponse;
  summary: SummaryResponse;
  overviews: OverviewsResponse;
};

export type ApiRequest<K extends keyof ApiRequestMap> = {
  name: K;
  url: string;
  paginated: boolean;
};