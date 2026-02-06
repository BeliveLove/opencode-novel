import type { Diagnostic } from "../../shared/errors/diagnostics";

export type NovelScanMode = "full" | "incremental";

export type NovelScanArgs = {
  rootDir?: string;
  manuscriptDir?: string;
  mode?: NovelScanMode;
  strictMode?: boolean;
  writeCache?: boolean;
};

export type NovelFileHash = {
  path: string;
  mtimeMs: number;
  size: number;
  sha256: string;
};

export type ChapterEntity = {
  chapter_id: string;
  title?: string;
  path: string;
  pov?: string;
  timeline?: { date?: string; start?: string; end?: string; location?: string };
  characters?: string[];
  factions?: string[];
  locations?: string[];
  threads_opened?: string[];
  threads_advanced?: string[];
  threads_closed?: string[];
  summary?: string;
  tags?: string[];
};

export type CharacterEntity = { id: string; name?: string; path: string; alias?: string[] };
export type ThreadEntity = { thread_id: string; type?: string; status?: string; path: string };
export type FactionEntity = { id: string; name?: string; path: string };
export type LocationEntity = { id: string; name?: string; path: string };

export type NovelScanResultJson = {
  version: 1;
  rootDir: string;
  manuscriptDir: string;
  stats: {
    filesScanned: number;
    entities: Record<string, number>;
    durationMs: number;
    cache: {
      mode: NovelScanMode;
      loaded: boolean;
      written: boolean;
      fastHits: number;
      hashHits: number;
      misses: number;
    };
  };
  files: NovelFileHash[];
  entities: {
    chapters: ChapterEntity[];
    characters: CharacterEntity[];
    threads: ThreadEntity[];
    factions: FactionEntity[];
    locations: LocationEntity[];
  };
  diagnostics: Diagnostic[];
  cache: { scanCachePath?: string };
};

export type ScanCacheV1 = NovelScanResultJson & {
  __internal?: {
    perFileDiagnostics?: Record<string, Diagnostic[]>;
  };
};
