const GITHUB_API_VERSION = "2022-11-28";
const GITHUB_API_BASE = "https://api.github.com";

export class RepositoryEvidenceError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "RepositoryEvidenceError";
    this.status = status;
  }
}

function headers(token: string): Record<string, string> {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };
}

async function githubFetch(path: string, token: string): Promise<Response> {
  const response = await fetch(`${GITHUB_API_BASE}${path}`, { headers: headers(token) });
  if (!response.ok) {
    throw new RepositoryEvidenceError(
      `GitHub returned ${response.status} while recovering repository evidence`,
      response.status,
    );
  }
  return response;
}

function repositoryPath(owner: string, name: string): string {
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

export async function fetchHeadSha(
  token: string,
  owner: string,
  name: string,
  branch: string,
): Promise<string> {
  const response = await githubFetch(
    `${repositoryPath(owner, name)}/commits/${encodeURIComponent(branch)}`,
    token,
  );
  const data = await response.json();
  const sha = String(data?.sha ?? "").toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(sha)) {
    throw new RepositoryEvidenceError("GitHub did not return a valid commit SHA", 502);
  }
  return sha;
}

export async function recoverDocumentation(
  token: string,
  owner: string,
  name: string,
  sha: string,
): Promise<void> {
  const response = await fetch(
    `${GITHUB_API_BASE}${repositoryPath(owner, name)}/readme?ref=${encodeURIComponent(sha)}`,
    { headers: headers(token) },
  );
  if (response.status === 404) return;
  if (!response.ok) {
    throw new RepositoryEvidenceError("GitHub could not recover repository documentation", response.status);
  }
  await response.json();
}

export async function examineStructure(
  token: string,
  owner: string,
  name: string,
  sha: string,
): Promise<void> {
  const response = await githubFetch(
    `${repositoryPath(owner, name)}/git/trees/${encodeURIComponent(sha)}?recursive=1`,
    token,
  );
  await response.json();
}

export async function traceHistory(
  token: string,
  owner: string,
  name: string,
  sha: string,
): Promise<void> {
  const response = await githubFetch(
    `${repositoryPath(owner, name)}/commits?sha=${encodeURIComponent(sha)}&per_page=25`,
    token,
  );
  await response.json();
}
