export type RepositoryStatus =
  | "unexamined_artifact"
  | "revival_in_progress"
  | "rescoped"
  | "preserved"
  | "revived";

export type CataloguedRepository = {
  id: string;
  githubRepositoryId: number;
  owner: string;
  name: string;
  defaultBranch: string;
  visibility: "public" | "private" | "internal";
  lastCommitAt: string | null;
  dormantSince: string | null;
  status: RepositoryStatus;
};
