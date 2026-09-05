// Minimal GitHub App API client for the installation and repository-listing
// flow. Never returns an installation access token or the App private key to
// callers outside this module.
import jwt from "npm:jsonwebtoken@9.0.2";

const GITHUB_API_VERSION = "2022-11-28";
const GITHUB_API_BASE = "https://api.github.com";

export class GitHubApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
  }
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  private: boolean;
  default_branch: string;
}

export interface AuthorizedRepository {
  githubRepositoryId: number;
  owner: string;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  lastCommitAt: string | null;
  installationId: number;
}

function headers(token: string): Record<string, string> {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };
}

export function createAppJwt(appId: string, privateKeyPem: string): string {
  const now = Math.floor(Date.now() / 1000);
  const normalizedKey = privateKeyPem.includes("\\n")
    ? privateKeyPem.replace(/\\n/g, "\n")
    : privateKeyPem;

  return jwt.sign(
    { iat: now - 30, exp: now + 540, iss: appId },
    normalizedKey,
    { algorithm: "RS256" },
  ) as string;
}

async function githubFetch(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<Response> {
  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    ...init,
    headers: { ...headers(token), ...(init.headers ?? {}) },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403 || response.status === 404) {
      throw new GitHubApiError(
        `GitHub declined the request to ${path} (${response.status})`,
        response.status,
      );
    }
    throw new GitHubApiError(
      `GitHub is temporarily unavailable (status ${response.status} from ${path})`,
      502,
    );
  }

  return response;
}

export async function fetchInstallation(
  appJwtToken: string,
  installationId: number,
): Promise<{ id: number; account: { login: string } }> {
  const response = await githubFetch(`/app/installations/${installationId}`, appJwtToken);
  return await response.json();
}

export async function mintInstallationToken(
  appJwtToken: string,
  installationId: number,
): Promise<string> {
  const response = await githubFetch(
    `/app/installations/${installationId}/access_tokens`,
    appJwtToken,
    { method: "POST" },
  );
  const data = await response.json();
  return String(data.token);
}

export async function listInstallationRepositories(
  installationToken: string,
): Promise<GitHubRepository[]> {
  const repositories: GitHubRepository[] = [];
  let page = 1;

  while (page <= 5) {
    const response = await githubFetch(
      `/installation/repositories?per_page=100&page=${page}`,
      installationToken,
    );
    const data = await response.json();
    const pageRepositories = (data.repositories ?? []) as GitHubRepository[];
    repositories.push(...pageRepositories);
    if (pageRepositories.length < 100) break;
    page += 1;
  }

  return repositories;
}

export async function fetchLatestDefaultBranchCommitDate(
  installationToken: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<string | null> {
  try {
    const response = await githubFetch(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(branch)}`,
      installationToken,
    );
    const data = await response.json();
    return data?.commit?.committer?.date ?? data?.commit?.author?.date ?? null;
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 404) {
      // An empty repository has no commits yet; that is not a failure.
      return null;
    }
    throw error;
  }
}

export function toAuthorizedRepository(
  repository: GitHubRepository,
  installationId: number,
  lastCommitAt: string | null,
): AuthorizedRepository {
  return {
    githubRepositoryId: repository.id,
    owner: repository.owner.login,
    name: repository.name,
    fullName: repository.full_name,
    private: repository.private,
    defaultBranch: repository.default_branch,
    lastCommitAt,
    installationId,
  };
}
