// Fetches the live tag list from GitHub for the NovaCareEMR repo.
// Used by /progress to show real-time evidence of stage shipment.
// Anonymous API: 60 req/hour/IP. With Next.js revalidate=300, that's ~12/hour.
// For PRIVATE repos: set GITHUB_TOKEN env var (PAT with `repo` or fine-grained `metadata:read`).

import { REPO_OWNER, REPO_NAME } from "./roadmap";

export type GitHubTag = {
  name: string;
  sha: string;
  url: string; // tag-page URL on github.com
};

export type FetchTagsResult = {
  tags: GitHubTag[];
  status: "ok" | "private" | "rate-limit" | "error";
  message?: string;
};

type GhRefResp = {
  ref: string;
  object: { sha: string; type: string };
};

export async function fetchTagsWithStatus(): Promise<FetchTagsResult> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "NovaCareEMR-progress-dashboard",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/tags`,
      {
        next: { revalidate: 300 },
        headers,
      },
    );
    if (!res.ok) {
      // 404 on private repo without token, or repo gone. 403 = rate limit.
      const status: FetchTagsResult["status"] =
        res.status === 404 ? "private" : res.status === 403 ? "rate-limit" : "error";
      console.warn(`GitHub tags fetch failed: ${res.status}`);
      return { tags: [], status, message: `HTTP ${res.status}` };
    }
    const data: GhRefResp[] | { message: string } = await res.json();
    if (!Array.isArray(data)) {
      return { tags: [], status: "error", message: "Non-array response" };
    }
    const tags = data.map((r) => {
      const name = r.ref.replace(/^refs\/tags\//, "");
      return {
        name,
        sha: r.object.sha,
        url: `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${encodeURIComponent(name)}`,
      };
    });
    return { tags, status: "ok" };
  } catch (err) {
    console.warn("GitHub tags fetch error:", err);
    return {
      tags: [],
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// Backwards-compatible thin wrapper.
export async function fetchTags(): Promise<GitHubTag[]> {
  const r = await fetchTagsWithStatus();
  return r.tags;
}

export function tagMatches(
  tags: GitHubTag[],
  expected: string | RegExp | undefined,
): GitHubTag | undefined {
  if (!expected) return undefined;
  if (typeof expected === "string") {
    return tags.find((t) => t.name === expected);
  }
  return tags.find((t) => expected.test(t.name));
}
