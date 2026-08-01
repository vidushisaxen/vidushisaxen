const GITHUB_USERNAME = "vidushisaxen";
const REST_API = "https://api.github.com";
const GRAPHQL_API = "https://api.github.com/graphql";

function getToken() {
  return process.env.GITHUB_TOKEN || "";
}

function restHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": GITHUB_USERNAME,
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function fetchUserProfile() {
  const res = await fetch(`${REST_API}/users/${GITHUB_USERNAME}`, {
    headers: restHeaders(),
  });
  if (!res.ok) throw new Error(`GitHub REST API error: ${res.status}`);
  return res.json();
}

async function fetchAllRepos() {
  const repos = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `${REST_API}/users/${GITHUB_USERNAME}/repos?per_page=100&page=${page}`,
      { headers: restHeaders() }
    );
    if (!res.ok) throw new Error(`GitHub REST API error: ${res.status}`);
    const batch = await res.json();
    repos.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }

  return repos;
}

function sumStars(repos) {
  return repos.reduce((total, repo) => total + (repo.stargazers_count || 0), 0);
}

async function graphqlRequest(query, variables) {
  const token = getToken();
  const res = await fetch(GRAPHQL_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": GITHUB_USERNAME,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) throw new Error(`GitHub GraphQL API error: ${res.status}`);

  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  return json.data;
}

async function fetchContributionCalendar() {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  const data = await graphqlRequest(query, { login: GITHUB_USERNAME });
  const weeks = data.user.contributionsCollection.contributionCalendar.weeks;
  const days = [];
  for (const week of weeks) {
    for (const day of week.contributionDays) {
      days.push(day);
    }
  }
  return days;
}

async function fetchTotalCommits() {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          totalCommitContributions
          restrictedContributionsCount
        }
      }
    }
  `;

  const data = await graphqlRequest(query, { login: GITHUB_USERNAME });
  const collection = data.user.contributionsCollection;
  return collection.totalCommitContributions + collection.restrictedContributionsCount;
}

function calculateCurrentStreak(days) {
  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...days].sort((a, b) => (a.date < b.date ? 1 : -1));

  let startIndex = 0;
  if (sorted.length && sorted[0].date === today && sorted[0].contributionCount === 0) {
    startIndex = 1;
  }

  let streak = 0;
  for (let i = startIndex; i < sorted.length; i += 1) {
    if (sorted[i].contributionCount > 0) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

module.exports = {
  GITHUB_USERNAME,
  fetchUserProfile,
  fetchAllRepos,
  sumStars,
  fetchContributionCalendar,
  fetchTotalCommits,
  calculateCurrentStreak,
};
