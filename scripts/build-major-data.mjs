import { mkdir, readFile, writeFile } from "node:fs/promises";

const TEAM_CSV = new URL("../valorant_majors_teams.csv", import.meta.url);
const PLAYER_CSV = new URL("../valorant_majors_players.csv", import.meta.url);
const OUT_JS = new URL("../data/major-data.js", import.meta.url);
const OUT_JSON = new URL("../data/major-data.json", import.meta.url);

const ROLE_KEYS = {
  Controller: "controller",
  Duelist: "duelist",
  Flex: "flex",
  Initiator: "initiator",
  Sentinel: "sentinel"
};

const REGION_SUBS = {
  APAC: "KR / JP / SEA / OCE",
  Americas: "NA / BR / LATAM",
  China: "CN",
  EMEA: "EU / TR / MENA",
  Unknown: "Unknown"
};

const teams = parseCsv(await readFile(TEAM_CSV, "utf8"));
const players = parseCsv(await readFile(PLAYER_CSV, "utf8"));

const teamsToRegions = {};
const playerYearTeams = {};
const playerYearRoleRatings = {};
const teamYearRosters = {};
const regionTeams = {};
const events = new Set();
const years = new Set();

for (const row of teams) {
  const team = row.team?.trim();
  const region = row.region?.trim() || "Unknown";
  if (!team) continue;
  teamsToRegions[team] = region;
  regionTeams[region] ||= [];
  addUnique(regionTeams[region], team);
}

for (const row of players) {
  const year = Number(row.year);
  const event = row.event?.trim();
  const player = row.player?.trim();
  const team = row.team?.trim();
  const region = row.region?.trim() || teamsToRegions[team] || "Unknown";
  const role = ROLE_KEYS[row.role?.trim()] || normalizeRole(row.role);
  const rating = toGameRating(Number(row.rating));
  const rounds = Number(row.rounds) || 0;
  const agents = splitList(row.agents);

  if (!year || !event || !isMajorEvent(event) || !player || !team || !role || !Number.isFinite(rating)) continue;

  years.add(year);
  if (event) events.add(`${year}:${event}`);
  teamsToRegions[team] = region;
  regionTeams[region] ||= [];
  addUnique(regionTeams[region], team);

  playerYearTeams[player] ||= {};
  playerYearTeams[player][year] ||= [];
  addUnique(playerYearTeams[player][year], team);

  playerYearRoleRatings[player] ||= {};
  playerYearRoleRatings[player][year] ||= {};
  playerYearRoleRatings[player][year][role] = Math.max(
    playerYearRoleRatings[player][year][role] || 0,
    rating
  );

  teamYearRosters[team] ||= {};
  teamYearRosters[team][year] ||= {};
  teamYearRosters[team][year][player] ||= {
    name: player,
    team,
    year,
    roles: {},
    agents: [],
    rounds: 0
  };
  teamYearRosters[team][year][player].roles[role] = Math.max(
    teamYearRosters[team][year][player].roles[role] || 0,
    rating
  );
  teamYearRosters[team][year][player].rounds += rounds;
  for (const agent of agents) addUnique(teamYearRosters[team][year][player].agents, agent);
}

const normalizedTeamYearRosters = Object.fromEntries(
  Object.entries(teamYearRosters).map(([team, yearsForTeam]) => [
    team,
    Object.fromEntries(
      Object.entries(yearsForTeam).map(([year, playersForYear]) => [
        year,
        Object.values(playersForYear).sort((a, b) => b.rounds - a.rounds || a.name.localeCompare(b.name))
      ])
    )
  ])
);

const data = {
  years: [...years].sort((a, b) => a - b),
  events: [...events].sort(),
  regionSubs: REGION_SUBS,
  teamsToRegions: sortObject(teamsToRegions),
  regionTeams: sortObject(Object.fromEntries(
    Object.entries(regionTeams).map(([region, values]) => [region, values.sort()])
  )),
  playerYearTeams: sortNestedObject(playerYearTeams),
  playerYearRoleRatings: sortNestedObject(playerYearRoleRatings),
  teamYearRosters: sortNestedObject(normalizedTeamYearRosters)
};

await mkdir(new URL("../data/", import.meta.url), { recursive: true });
await writeFile(OUT_JSON, `${JSON.stringify(data, null, 2)}\n`);
await writeFile(OUT_JS, `window.valorantMajorData = ${JSON.stringify(data, null, 2)};\n`);

console.log(`Wrote ${OUT_JS.pathname}`);
console.log(`Teams: ${Object.keys(data.teamsToRegions).length}`);
console.log(`Players: ${Object.keys(data.playerYearTeams).length}`);
console.log(`Years: ${data.years.join(", ")}`);

function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      field += "\"";
      index += 1;
    } else if (char === "\"") {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      field = "";
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    if (row.some((value) => value.trim())) rows.push(row);
  }

  const [headers, ...records] = rows;
  return records.map((record) => Object.fromEntries(headers.map((header, index) => [
    header.trim(),
    record[index] ?? ""
  ])));
}

function toGameRating(vlrRating) {
  return Math.max(1, Math.min(99, Math.round(vlrRating * 65 + 10)));
}

function normalizeRole(value) {
  const key = String(value || "").trim().toLowerCase();
  return key || null;
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isMajorEvent(event) {
  return /\b(Masters|Champions)\b/i.test(event);
}

function addUnique(list, value) {
  if (value && !list.includes(value)) list.push(value);
}

function sortObject(obj) {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}

function sortNestedObject(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => String(a).localeCompare(String(b), undefined, { numeric: true }))
      .map(([key, nested]) => [key, sortNestedObject(nested)])
  );
}
