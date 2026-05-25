// Minimal ambient types for optional meilisearch usage (blog scoped)
declare module 'meilisearch' {
  export class MeiliSearch {
    constructor(cfg: { host: string; apiKey?: string });
    getIndex(index: string): Promise<any> & any;
    createIndex(index: string, cfg?: any): Promise<any>;
  }
}