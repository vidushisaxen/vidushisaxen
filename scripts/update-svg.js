const fs = require("fs");
const path = require("path");
const {
  fetchUserProfile,
  fetchAllRepos,
  sumStars,
  fetchContributionCalendar,
  fetchTotalCommits,
  calculateCurrentStreak,
} = require("./github");

const TEMPLATE_PATH = path.join(__dirname, "..", "template.svg");
const OUTPUT_PATH = path.join(__dirname, "..", "terminal.svg");
const PLACEHOLDER = "--";

async function safe(fn, fallback = PLACEHOLDER) {
  try {
    return await fn();
  } catch (err) {
    console.error(`[update-svg] fetch failed: ${err.message}`);
    return fallback;
  }
}

function formatLastUpdated() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const datePart = formatter.format(now);
  const timePart = timeFormatter.format(now);

  return `${datePart} • ${timePart} IST`;
}

function replaceById(svg, id, value) {
  const pattern = new RegExp(`(id="${id}"[^>]*>)([^<]*)(<)`);
  if (!pattern.test(svg)) {
    console.warn(`[update-svg] id "${id}" not found in template`);
    return svg;
  }
  return svg.replace(pattern, `$1${value}$3`);
}

async function collectStats() {
  const profile = await safe(fetchUserProfile, null);
  const repos = await safe(fetchAllRepos, []);
  const calendar = await safe(fetchContributionCalendar, []);
  const totalCommits = await safe(fetchTotalCommits, null);

  const repoCount = profile ? profile.public_repos : PLACEHOLDER;
  const followers = profile ? profile.followers : PLACEHOLDER;
  const following = profile ? profile.following : PLACEHOLDER;
  const stars = repos.length ? sumStars(repos) : PLACEHOLDER;
  const commits = totalCommits !== null ? totalCommits : PLACEHOLDER;
  const streak = calendar.length ? calculateCurrentStreak(calendar) : PLACEHOLDER;

  return {
    repo_data: repoCount,
    star_data: stars,
    follower_data: followers,
    following_data: following,
    commit_data: commits,
    streak_data: streak === PLACEHOLDER ? streak : `${streak}`,
    updated_data: formatLastUpdated(),
  };
}

async function main() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Template not found at ${TEMPLATE_PATH}`);
  }

  let svg = fs.readFileSync(TEMPLATE_PATH, "utf8");
  const stats = await collectStats();

  for (const [id, value] of Object.entries(stats)) {
    svg = replaceById(svg, id, value);
  }

  fs.writeFileSync(OUTPUT_PATH, svg);
  console.log("[update-svg] terminal.svg generated with stats:", stats);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
