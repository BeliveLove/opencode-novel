export type TaxonomyDomain =
  | "genre"
  | "trope"
  | "audience"
  | "emotion"
  | "structure"
  | "market";

export type TaxonomyStatus = "active" | "deprecated";

export type TaxonomyLabel = {
  id: string;
  name: string;
  aliases: string[];
  parentId: string | null;
  conflicts: string[];
  status: TaxonomyStatus;
};

export type TaxonomyRegistry = {
  version: string;
  updatedAt: string;
  domains: Record<TaxonomyDomain, TaxonomyLabel[]>;
};

export type TaxonomyResultLabel = {
  id: string;
  name: string;
  confidence: number;
  evidence: string[];
};

export type TaxonomyClassifyResult = {
  domain: TaxonomyDomain;
  labels: TaxonomyResultLabel[];
  unmatched: string[];
  notes: string[];
};

export type TaxonomyProfileMode = "compact" | "full";

export type TaxonomyProfile = {
  version: string;
  profileMode: TaxonomyProfileMode;
  genre?: TaxonomyResultLabel[];
  trope?: TaxonomyResultLabel[];
  audience?: TaxonomyResultLabel[];
  emotion?: TaxonomyResultLabel[];
  structure?: TaxonomyResultLabel[];
  market?: TaxonomyResultLabel[];
  missingDomains: TaxonomyDomain[];
  coverage: number;
  conflictWarnings: string[];
  summary: string;
};
