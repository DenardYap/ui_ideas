import { useQuery } from '@tanstack/react-query';

export const GITHUB_REPO = 'DenardYap/ui_ideas';
export const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO}`;

type GithubRepoResponse = {
  stargazers_count: number;
};

async function fetchGithubStars(repo: string): Promise<number> {
  const res = await fetch(`https://api.github.com/repos/${repo}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch GitHub stars (${res.status})`);
  }
  const data: GithubRepoResponse = await res.json();
  return data.stargazers_count;
}

export function useGithubStars(repo: string = GITHUB_REPO) {
  return useQuery({
    queryKey: ['github-stars', repo],
    queryFn: () => fetchGithubStars(repo),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function formatStarCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return String(count);
}
