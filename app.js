const YEARS = [2020, 2021, 2022, 2023, 2024, 2025];

const roles = [
  { key: "duelist", label: "Duelist" },
  { key: "initiator", label: "Initiator" },
  { key: "controller", label: "Controller" },
  { key: "sentinel", label: "Sentinel" },
  { key: "flex", label: "Flex" }
];

const regionTeams = {
  APAC: ["Paper Rex", "Gen.G", "DRX", "T1", "Rex Regum Qeon"],
  Americas: ["Sentinels", "LOUD", "G2 Esports", "Leviatan", "NRG"],
  China: ["EDward Gaming", "Bilibili Gaming", "Trace Esports", "FunPlus Phoenix", "Wolves Esports"],
  EMEA: ["FNATIC", "Team Heretics", "Team Liquid", "Natus Vincere", "Karmine Corp"]
};

const regions = [
  makeRegion("apac", "APAC", "KR / JP / SEA / OCE"),
  makeRegion("americas", "Americas", "NA / BR / LATAM"),
  makeRegion("china", "China", "CN"),
  makeRegion("emea", "EMEA", "EU / TR / MENA")
];

const teamPlayerPools = {
  "Paper Rex": ["something", "Jinggg", "mindfreak", "f0rsakeN", "d4v41", "Benkai", "Monyet", "cgrs", "PatMen", "Tommy"],
  "Gen.G": ["t3xture", "Lakia", "Karon", "Meteor", "Munchkin", "Secret", "eKo", "TS", "k1Ng", "Suggest"],
  "DRX": ["BuZz", "stax", "Mako", "Rb", "Zest", "MaKo", "Foxy9", "Flashback", "BeYN", "glow"],
  "T1": ["Sayaplayer", "xeta", "iZu", "Carpe", "stax", "Munchkin", "ban", "Autumn", "Sylvan", "xccurate"],
  "Rex Regum Qeon": ["Monyet", "Lmemore", "EJAY", "fl1pzjder", "Estrella", "xffero", "2ge", "Tehbotol", "Emman", "Kush"],
  "Sentinels": ["zekken", "Sacy", "TenZ", "johnqt", "Zellsis", "ShahZaM", "SicK", "dapr", "zombs", "pANcada"],
  "LOUD": ["aspas", "Cauanzin", "pANcada", "Less", "Saadhak", "Sacy", "bzkA", "qck", "tuyz", "mwzera"],
  "G2 Esports": ["jawgemo", "trent", "valyn", "leaf", "JonahP", "neT", "mCe", "icy", "penny", "wippie"],
  "Leviatan": ["keznit", "Mazino", "kiNgg", "Shyy", "tex", "Tacolilla", "nzr", "Nozwerr", "Melser", "adverso"],
  "NRG": ["Demon1", "crashies", "s0m", "FNS", "Victor", "ardiis", "Ethan", "Marved", "yay", "eeiu"],
  "EDward Gaming": ["ZmjjKK", "Haodong", "nobody", "CHICHOO", "Smoggy", "Life", "After", "S1Mon", "Abo", "WoodAy1"],
  "Bilibili Gaming": ["whzy", "Knight", "rin", "Biank", "Yosemite", "b3ar", "Levius", "nephh", "Flex1n", "LuoK1ng"],
  "Trace Esports": ["Kai", "FengF", "Abo", "heybay", "Luoking", "Biank", "RA", "B1ack", "Flicker", "Swerl"],
  "FunPlus Phoenix": ["Life", "AAAAY", "BerLIN", "Lysoar", "autumn", "Shao", "ANGE1", "ardiis", "Zyppan", "dimasick"],
  "Wolves Esports": ["Spring", "Yuicaw", "Lysoar", "SiufatBB", "whzy", "TvirusLuke", "ICEKING", "Swerl", "B1ack", "Flex1n"],
  "FNATIC": ["Derke", "Leo", "Chronicle", "Alfajer", "Boaster", "Mistic", "Enzo", "Magnum", "Doma", "tsack"],
  "Team Heretics": ["MiniBoo", "RieNs", "benjyfishy", "Boo", "Wo0t", "keloqz", "Mixwell", "Avova", "zeek", "paTiTek"],
  "Team Liquid": ["Jamppi", "nAts", "Mistic", "soulcas", "Sayf", "ScreaM", "Nivera", "L1NK", "Redgar", "Keiko"],
  "Natus Vincere": ["cNed", "ANGE1", "Shao", "suygetsu", "ardiis", "Zyppan", "Cloud", "dimasick", "7ssk7", "Duno"],
  "Karmine Corp": ["marteen", "N4RRATE", "tomaszy", "MAGNUM", "Shin", "ScreaM", "Nivera", "xms", "Newzera", "ZE1SH"]
};

const explicitRoleRatings = {
  aspas: { duelist: 98, flex: 82 },
  ZmjjKK: { duelist: 97, flex: 83 },
  something: { duelist: 96, flex: 88, initiator: 81 },
  t3xture: { duelist: 96, flex: 82 },
  Derke: { duelist: 95, flex: 84 },
  zekken: { duelist: 94, flex: 91, initiator: 84 },
  TenZ: { controller: 91, duelist: 94, flex: 87 },
  Chronicle: { controller: 93, flex: 96, initiator: 90, sentinel: 84 },
  f0rsakeN: { sentinel: 90, flex: 96, duelist: 91, initiator: 86 },
  Jinggg: { initiator: 87, duelist: 94, flex: 89 },
  Mako: { controller: 97, flex: 86 },
  Karon: { controller: 94, flex: 82 },
  Less: { sentinel: 96, controller: 87, flex: 82 },
  Alfajer: { sentinel: 96, duelist: 88, flex: 84 },
  Leo: { initiator: 97, flex: 85 },
  Sacy: { initiator: 92, flex: 86 },
  nAts: { sentinel: 95, initiator: 86, controller: 82 },
  Boaster: { flex: 88, controller: 84, initiator: 82 },
  Saadhak: { flex: 94, initiator: 89, sentinel: 84 },
  valyn: { controller: 88, flex: 92, sentinel: 82 },
  johnqt: { sentinel: 88, flex: 91, controller: 80 },
  Meteor: { sentinel: 94, duelist: 88 },
  CHICHOO: { sentinel: 93, controller: 85 },
  mindfreak: { controller: 91, flex: 83 },
  d4v41: { flex: 92, initiator: 88, controller: 84 },
  Wo0t: { flex: 94, duelist: 92, initiator: 87 },
  benjyfishy: { controller: 87, sentinel: 90, flex: 86 },
  N4RRATE: { initiator: 90, duelist: 87, flex: 85 }
};

const teamYearRosters = buildTeamYearRosters();
let state = createFreshState();

function makeRegion(key, label, sub) {
  return {
    key,
    label,
    sub,
    teams: Object.fromEntries(regionTeams[label].map((team) => [team, YEARS]))
  };
}

function buildTeamYearRosters() {
  const rosters = {};
  Object.keys(teamPlayerPools).forEach((team) => {
    rosters[team] = {};
    YEARS.forEach((year, yearIndex) => {
      const pool = teamPlayerPools[team];
      rosters[team][year] = roles.map((role, roleIndex) => {
        const playerName = pool[(yearIndex + roleIndex) % pool.length];
        return {
          name: playerName,
          naturalRole: role.key,
          ratings: ratingsForPlayer(playerName)
        };
      });
    });
  });
  return rosters;
}

function ratingsForPlayer(name) {
  const explicit = explicitRoleRatings[name] || {};
  return Object.fromEntries(roles.map((role, index) => {
    const fallback = 64 + ((hashString(`${name}-${role.key}`) + index * 7) % 22);
    return [role.key, explicit[role.key] || fallback];
  }));
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function createFreshState() {
  return {
    screen: "start",
    picks: [],
    draw: null,
    rerolls: { region: 1, team: 1, year: 1 }
  };
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomDifferent(items, current) {
  const options = items.filter((item) => item !== current);
  return randomItem(options.length ? options : items);
}

function makeDraw(regionOverride, yearOverride) {
  const region = regionOverride || randomItem(regions);
  const year = yearOverride || randomItem(YEARS);
  const teams = teamsForRegionYear(region, year);
  const team = randomItem(teams);
  return { region, team, year };
}

function teamsForRegionYear(region, year) {
  return Object.keys(region.teams).filter((team) => teamYearRosters[team]?.[year]);
}

function openRoles() {
  const pickedRoles = new Set(state.picks.map((pick) => pick.roleKey));
  return roles.filter((role) => !pickedRoles.has(role.key));
}

function currentRoster() {
  if (!state.draw) return [];
  return teamYearRosters[state.draw.team]?.[state.draw.year] || [];
}

function candidatesForDraw() {
  const roster = currentRoster();
  const draftedPlayers = new Set(state.picks.map((pick) => pick.name));
  return openRoles().map((role) => {
    const bestPlayer = roster
      .filter((player) => !draftedPlayers.has(player.name))
      .sort((a, b) => b.ratings[role.key] - a.ratings[role.key])[0] || roster[0];
    return {
      id: `${state.draw.team}-${state.draw.year}-${role.key}-${bestPlayer.name}`,
      roleKey: role.key,
      role: role.label,
      name: bestPlayer.name,
      team: state.draw.team,
      year: state.draw.year,
      rating: bestPlayer.ratings[role.key]
    };
  });
}

function setScreen(screen) {
  state.screen = screen;
  document.querySelectorAll("[data-screen]").forEach((el) => {
    el.classList.toggle("is-hidden", el.dataset.screen !== screen);
  });
}

function renderSlots(container) {
  container.innerHTML = roles.map((role) => {
    const pick = state.picks.find((item) => item.roleKey === role.key);
    return `
      <article class="slot ${pick ? "is-filled" : "is-open"}">
        <span class="slot-role">${role.label}</span>
        <strong class="slot-player">${pick ? pick.name : "-"}</strong>
        ${pick ? `<span class="slot-role">${pick.team} / ${pick.year}</span>` : ""}
      </article>
    `;
  }).join("");
}

function renderGame() {
  if (!state.draw) state.draw = makeDraw();
  renderSlots(document.querySelector('[data-bind="slots"]'));

  const openRoleLabels = openRoles().map((item) => item.label).join(" / ");
  document.querySelector('[data-bind="phase"]').textContent = "Draft";
  document.querySelector('[data-bind="pickCount"]').textContent = `Pick ${Math.min(state.picks.length + 1, 5)}/5`;
  document.querySelector('[data-bind="regionKicker"]').textContent = `${state.draw.region.label} / ${state.draw.region.sub}`;
  document.querySelector('[data-bind="region"]').textContent = state.draw.region.label;
  document.querySelector('[data-bind="team"]').textContent = state.draw.team;
  document.querySelector('[data-bind="year"]').textContent = state.draw.year;
  document.querySelector('[data-bind="regionRolls"]').textContent = state.rerolls.region;
  document.querySelector('[data-bind="teamRolls"]').textContent = state.rerolls.team;
  document.querySelector('[data-bind="yearRolls"]').textContent = state.rerolls.year;
  document.querySelector('[data-bind="openRoles"]').textContent = openRoleLabels
    ? `${state.draw.team} ${state.draw.year} players - open: ${openRoleLabels}`
    : "Roster locked";

  document.querySelector('[data-action="rerollRegion"]').disabled = state.rerolls.region < 1;
  document.querySelector('[data-action="rerollTeam"]').disabled = state.rerolls.team < 1;
  document.querySelector('[data-action="rerollYear"]').disabled = state.rerolls.year < 1;

  const cards = candidatesForDraw();
  document.querySelector('[data-bind="candidates"]').innerHTML = cards.map((candidate) => `
    <article class="candidate-card">
      <span>${candidate.role}</span>
      <strong>${candidate.name}</strong>
      <button data-draft="${candidate.id}">Draft &gt;</button>
    </article>
  `).join("");
}

function renderResult() {
  renderSlots(document.querySelector('[data-bind="finalRoster"]'));
  const teams = new Set(state.picks.map((pick) => pick.team)).size;
  const years = state.picks.map((pick) => pick.year);
  const yearSpread = Math.max(...years) - Math.min(...years);
  const averageRating = state.picks.reduce((total, pick) => total + pick.rating, 0) / state.picks.length;
  const score = Math.max(62, Math.min(99, Math.round(averageRating + teams * 1.5 + Math.max(0, 8 - yearSpread))));
  document.querySelector('[data-bind="score"]').textContent = score;
  document.querySelector('[data-bind="scoreText"]').textContent =
    score > 90 ? "A frightening international superteam." :
    score > 80 ? "Balanced, explosive and ready for playoffs." :
    "High upside, but the comms room might get spicy.";
}

function draftPlayer(candidateId) {
  const candidate = candidatesForDraw().find((item) => item.id === candidateId);
  if (!candidate) return;
  state.picks.push(candidate);
  if (state.picks.length === roles.length) {
    renderResult();
    setScreen("result");
    return;
  }

  state.draw = makeDraw();
  renderGame();
}

function handleAction(action) {
  if (action === "start") {
    state = createFreshState();
    state.draw = makeDraw();
    renderGame();
    setScreen("game");
  }

  if (action === "reset") {
    state = createFreshState();
    setScreen("start");
  }

  if (action === "rerollRegion" && state.rerolls.region > 0) {
    state.rerolls.region -= 1;
    const region = randomDifferent(regions, state.draw.region);
    const teams = teamsForRegionYear(region, state.draw.year);
    state.draw = {
      region,
      team: randomItem(teams),
      year: state.draw.year
    };
    renderGame();
  }

  if (action === "rerollTeam" && state.rerolls.team > 0) {
    state.rerolls.team -= 1;
    const teams = teamsForRegionYear(state.draw.region, state.draw.year);
    state.draw.team = randomDifferent(teams, state.draw.team);
    renderGame();
  }

  if (action === "rerollYear" && state.rerolls.year > 0) {
    state.rerolls.year -= 1;
    state.draw.year = randomDifferent(YEARS, state.draw.year);
    renderGame();
  }
}

document.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  if (actionTarget) handleAction(actionTarget.dataset.action);

  const draftTarget = event.target.closest("[data-draft]");
  if (draftTarget) draftPlayer(draftTarget.dataset.draft);
});
