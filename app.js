const majorData = window.valorantMajorData;

if (!majorData) {
  throw new Error("Missing data/major-data.js. Run `node scripts/build-major-data.mjs`.");
}

const YEARS = majorData.years;

const roles = [
  { key: "duelist", label: "Duelist" },
  { key: "initiator", label: "Initiator" },
  { key: "controller", label: "Controller" },
  { key: "sentinel", label: "Sentinel" },
  { key: "flex", label: "Flex" }
];

const regions = [
  makeRegion("americas", "AMER"),
  makeRegion("china", "CN"),
  makeRegion("apac", "APAC"),
  makeRegion("emea", "EMEA")
].filter((region) => Object.keys(region.teams).length);

const teamYearRosters = buildTeamYearRosters();

let state = createFreshState();

function makeRegion(key, label) {
  const regionTeamNames = majorData.regionTeams[label] || [];
  return {
    key,
    label,
    sub: majorData.regionSubs[label] || label,
    teams: Object.fromEntries(regionTeamNames.map((team) => [
      team,
      YEARS.filter((year) => majorData.teamYearRosters[team]?.[year]?.length)
    ]).filter(([, years]) => years.length))
  };
}

function buildTeamYearRosters() {
  return Object.fromEntries(Object.entries(majorData.teamYearRosters).map(([team, yearsForTeam]) => [
    team,
    Object.fromEntries(Object.entries(yearsForTeam).map(([year, players]) => [
      year,
      players.map((player) => ({
        name: player.name,
        naturalRole: topRoleKey(player.roles),
        ratings: player.roles,
        agents: player.agents,
        rounds: player.rounds
      }))
    ]))
  ]));
}

function topRoleKey(ratings) {
  return Object.entries(ratings || {})
    .sort(([, a], [, b]) => b - a)[0]?.[0] || "flex";
}

function playableRolesForPlayer(player) {
  return roles
    .filter((role) => Number.isFinite(player.ratings[role.key]))
    .map((role) => role.key);
}

function createFreshState() {
  return {
    screen: "start",
    picks: [],
    draw: null,
    isRolling: false,
    rerolls: 3
  };
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function makeDraw(regionOverride, yearOverride) {
  let region = regionOverride;
  let year = yearOverride;

  if (region && year && !teamsForRegionYear(region, year).length) {
    year = randomItem(validYearsForRegion(region));
  }
  if (!region && year) {
    region = randomItem(validRegionsForYear(year));
  }
  if (region && !year) {
    year = randomItem(validYearsForRegion(region));
  }
  if (!region && !year) {
    region = randomItem(regions.filter((item) => validYearsForRegion(item).length));
    year = region ? randomItem(validYearsForRegion(region)) : null;
  }
  if (!region || !year) return null;

  const teams = teamsForRegionYear(region, year);
  if (!teams.length) return null;

  const team = randomItem(teams);
  return { region, team, year };
}

function teamsForRegionYear(region, year) {
  return Object.keys(region?.teams || {}).filter((team) => teamYearRosters[team]?.[year]?.length);
}

function validRegionsForYear(year) {
  return regions.filter((region) => teamsForRegionYear(region, year).length);
}

function validYearsForRegion(region) {
  return YEARS.filter((year) => teamsForRegionYear(region, year).length);
}

function drawKey(draw) {
  return `${draw.region.key}:${draw.team}:${draw.year}`;
}

function allValidDraws() {
  return regions.flatMap((region) => validYearsForRegion(region).flatMap((year) => (
    teamsForRegionYear(region, year).map((team) => ({ region, team, year }))
  )));
}

function canRosterFillOpenRoles(draw) {
  const draftedPlayers = new Set(state.picks.map((pick) => pick.name));
  const availablePlayers = (teamYearRosters[draw.team]?.[draw.year] || [])
    .filter((player) => !draftedPlayers.has(player.name));

  const rolesToFill = openRoles()
    .map((role) => ({
      key: role.key,
      players: availablePlayers.filter((player) => playableRolesForPlayer(player).includes(role.key))
    }))
    .sort((a, b) => a.players.length - b.players.length);

  if (rolesToFill.some((role) => role.players.length === 0)) return false;

  const usedPlayers = new Set();
  const canAssignRoles = (roleIndex) => {
    if (roleIndex === rolesToFill.length) return true;
    return rolesToFill[roleIndex].players.some((player) => {
      if (usedPlayers.has(player.name)) return false;
      usedPlayers.add(player.name);
      const assigned = canAssignRoles(roleIndex + 1);
      usedPlayers.delete(player.name);
      return assigned;
    });
  };

  return canAssignRoles(0);
}

function rerollDrawOptions() {
  const draws = allValidDraws().filter((draw) => canRosterFillOpenRoles(draw));
  if (!state.draw) return draws;
  const currentKey = drawKey(state.draw);
  return draws.filter((draw) => drawKey(draw) !== currentKey);
}

function openRoles() {
  const pickedRoles = new Set(state.picks.map((pick) => pick.roleKey));
  return roles.filter((role) => !pickedRoles.has(role.key));
}

function roleForKey(roleKey) {
  return roles.find((role) => role.key === roleKey);
}

function currentRoster() {
  if (!state.draw) return [];
  return teamYearRosters[state.draw.team]?.[state.draw.year] || [];
}

function drawSnapshot(draw = state.draw) {
  return {
    region: draw.region,
    team: draw.team,
    year: draw.year
  };
}

function setDrawDisplay(draw) {
  document.querySelector('[data-bind="regionKicker"]').textContent = draw.region.label;
  document.querySelector('[data-bind="region"]').textContent = draw.region.label;
  document.querySelector('[data-bind="team"]').textContent = draw.team;
  document.querySelector('[data-bind="year"]').textContent = draw.year;
}

function setRollingState(isRolling) {
  state.isRolling = isRolling;
  document.querySelector(".spin-panel")?.classList.toggle("is-rolling", isRolling);
  document.querySelectorAll("[data-action], [data-draft]").forEach((button) => {
    button.disabled = isRolling || button.disabled;
  });
}

function randomPreviewDraw(finalDraw, reels) {
  const preview = drawSnapshot();
  if (reels.includes("region")) {
    preview.region = randomItem(validRegionsForYear(finalDraw.year)) || finalDraw.region;
  } else {
    preview.region = finalDraw.region;
  }
  if (reels.includes("year")) {
    preview.year = randomItem(validYearsForRegion(preview.region)) || finalDraw.year;
  } else {
    preview.year = finalDraw.year;
  }
  const teams = teamsForRegionYear(preview.region, preview.year);
  if (reels.includes("team") || reels.includes("region") || reels.includes("year")) {
    preview.team = randomItem(teams) || finalDraw.team;
  } else {
    preview.team = finalDraw.team;
  }
  return preview;
}

async function animateDrawChange(finalDraw, reels) {
  setRollingState(true);
  for (let tick = 0; tick < 10; tick += 1) {
    setDrawDisplay(randomPreviewDraw(finalDraw, reels));
    await sleep(42 + tick * 12);
  }
  state.draw = finalDraw;
  setDrawDisplay(finalDraw);
  await sleep(120);
  setRollingState(false);
  renderGame();
}

function candidatesForDraw() {
  const roster = currentRoster();
  const draftedPlayers = new Set(state.picks.map((pick) => pick.name));
  const openRoleKeys = new Set(openRoles().map((openRole) => openRole.key));

  return roster.map((player) => {
    const playerRoles = playableRolesForPlayer(player);
    const roleOptions = roles
      .filter((playerRole) => playerRoles.includes(playerRole.key))
      .map((playerRole) => ({
        key: playerRole.key,
        label: playerRole.label,
        rating: player.ratings[playerRole.key],
        isOpen: openRoleKeys.has(playerRole.key) && !draftedPlayers.has(player.name)
      }));

    const primaryRole = roleOptions.find((role) => role.isOpen) || roleOptions[0] || roleForKey(player.naturalRole);

    return {
      id: `${state.draw.team}-${state.draw.year}-${player.name}`,
      roleKey: primaryRole.key,
      role: roleOptions.map((role) => role.label).join(" / "),
      name: player.name,
      team: state.draw.team,
      year: state.draw.year,
      ratings: player.ratings,
      rating: player.ratings[primaryRole.key],
      roleTags: getPlayerRoleTags(player),
      roleOptions
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
    if (!pick) {
      return `
        <article class="slot is-open">
          <span class="slot-role">${role.label}</span>
          <strong class="slot-player">-</strong>
        </article>
      `;
    }
    const tags = pick.roleTags?.length
      ? pick.roleTags.join(", ")
      : pick.role;
    return `
      <article class="slot is-filled">
        <span class="slot-role">${role.label}</span>
        <strong class="slot-player">${pick.name}</strong>
        <span class="slot-role">${pick.team} / ${pick.year}</span>
        <small>${tags}</small>
      </article>
    `;
  }).join("");
}

function renderGame() {
  if (!state.draw) state.draw = randomItem(rerollDrawOptions());
  if (!state.draw) return;

  document.querySelector(".spin-panel")?.classList.toggle("is-rolling", state.isRolling);

  renderSlots(document.querySelector('[data-bind="slots"]'));

  const openRoleLabels = openRoles().map((item) => item.label).join(" / ");

  document.querySelector('[data-bind="phase"]').textContent = "Draft";
  document.querySelector('[data-bind="pickCount"]').textContent = `Pick ${Math.min(state.picks.length + 1, 5)}/5`;
  document.querySelector('[data-bind="regionKicker"]').textContent = state.draw.region.label;
  document.querySelector('[data-bind="region"]').textContent = state.draw.region.label;
  document.querySelector('[data-bind="team"]').textContent = state.draw.team;
  document.querySelector('[data-bind="year"]').textContent = state.draw.year;
  document.querySelector('[data-bind="rerolls"]').textContent = state.rerolls;
  document.querySelector('[data-bind="openRoles"]').textContent = openRoleLabels
    ? `${state.draw.team} ${state.draw.year} players - open: ${openRoleLabels}`
    : "Roster locked";

  document.querySelector('[data-action="rerollDraw"]').disabled = state.isRolling || state.rerolls < 1 || !rerollDrawOptions().length;

  const cards = candidatesForDraw();
  document.querySelector('[data-bind="candidates"]').innerHTML = cards.map((candidate) => `
    <article class="candidate-card" data-candidate-card="${candidate.id}">
      <span>${candidate.role}</span>
      <strong>${candidate.name}</strong>
      <div class="candidate-roles">
        ${candidate.roleOptions.map((role) => `
          <button data-draft="${candidate.id}" data-role-key="${role.key}" ${role.isOpen && !state.isRolling ? "" : "disabled"}>
            ${role.label}
          </button>
        `).join("")}
      </div>
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

async function draftPlayer(candidateId, selectedRoleKey) {
  if (state.isRolling) return;

  const candidate = candidatesForDraw().find((item) => item.id === candidateId);
  if (!candidate) return;

  const selectedRole = candidate.roleOptions.find((role) => role.key === selectedRoleKey && role.isOpen) ||
    candidate.roleOptions.find((role) => role.key === candidate.roleKey && role.isOpen);
  if (!selectedRole) return;

  state.picks.push({
    ...candidate,
    id: `${candidate.team}-${candidate.year}-${selectedRole.key}-${candidate.name}`,
    roleKey: selectedRole.key,
    role: roleForKey(selectedRole.key).label,
    rating: candidate.ratings[selectedRole.key]
  });

  if (state.picks.length === roles.length) {
    renderResult();
    setScreen("result");
    return;
  }

  const draw = randomItem(rerollDrawOptions());
  if (!draw) return;
  await animateDrawChange(draw, ["region", "team", "year"]);
}

async function handleAction(action) {
  if (state.isRolling) return;

  if (action === "start") {
    state = createFreshState();
    state.draw = randomItem(rerollDrawOptions());
    if (!state.draw) return;
    renderGame();
    setScreen("game");
  }

  if (action === "reset") {
    state = createFreshState();
    setScreen("start");
  }

  if (action === "rerollDraw" && state.rerolls > 0) {
    const draw = randomItem(rerollDrawOptions());
    if (!draw) return;
    state.rerolls -= 1;
    await animateDrawChange(draw, ["region", "team", "year"]);
  }
}

document.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  if (actionTarget) handleAction(actionTarget.dataset.action);

  const draftTarget = event.target.closest("[data-draft]");
  if (draftTarget) {
    draftPlayer(draftTarget.dataset.draft, draftTarget.dataset.roleKey);
  }
});

function getPlayerRoleTags(player) {
  return roles
    .filter((r) => playableRolesForPlayer(player).includes(r.key))
    .map((r) => r.label);
}
