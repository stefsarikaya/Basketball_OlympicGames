const fs = require('fs');

// Učitavanje JSON podataka
const groups = JSON.parse(fs.readFileSync('./data/groups.json', 'utf8'));
const exhibitions = JSON.parse(fs.readFileSync('./data/exibitions.json', 'utf8'));
// Definisanje objekta za timove
const teams = {};

// Popunjavanje timova iz groups.json i dodavanje grupe svakom timu
Object.keys(groups).forEach(group => {
  groups[group].forEach(team => {
    teams[team.ISOCode] = {
      name: team.Team,
      ISOCode: team.ISOCode,
      FIBARanking: team.FIBARanking,
      wins: 0,
      losses: 0,
      points: 0,
      scoreFor: 0,
      scoreAgainst: 0,
      diff: 0,
      group: group
    };
  });
});

// Memorija za čuvanje rezultata već odigranih utakmica tokom grupne faze
const groupStageResults = {};

function simulateGame(team1, team2, isGroupStage = true) {
  // Sortiraj timove abecedno kako bi ključ bio isti bez obzira na redosled
  const sortedTeams = [team1, team2].sort();
  const matchupKey = `${sortedTeams[0]}-${sortedTeams[1]}`;

  // Provera da li je utakmica već odigrana tokom grupne faze
  if (isGroupStage && groupStageResults[matchupKey]) {
    return groupStageResults[matchupKey];
  }

  const team1Rank = teams[team1].FIBARanking;
  const team2Rank = teams[team2].FIBARanking;
  const rankDifference = team1Rank - team2Rank;

  const probability1 = 1 / (1 + Math.pow(10, (rankDifference / 400)));
  
  // Generisanje rezultata na osnovu verovatnoće
  const baseScore = 70; // Osnovni broj poena
  const variance = 30;  // Moguć raspon poena (od 70 do 100)

  // Rezultati koji su vezani za verovatnoću
  const score1 = Math.floor(baseScore + variance * (Math.random() * probability1));
  const score2 = Math.floor(baseScore + variance * (Math.random() * (1 - probability1)));

  let result;
  if (score1 > score2) {
    result = { winner: team1, loser: team2 };
  } else {
    result = { winner: team2, loser: team1 };
  }

  // Ažuriraj rezultate timova
  teams[team1].scoreFor += score1;
  teams[team1].scoreAgainst += score2;
  teams[team2].scoreFor += score2;
  teams[team2].scoreAgainst += score1;

  teams[team1].diff += score1 - score2;
  teams[team2].diff += score2 - score1;

  // Ažuriraj pobede, poraze i bodove
  if (result.winner === team1) {
    teams[team1].wins += 1;
    teams[team1].points += 2;
    teams[team2].losses += 1;
    teams[team2].points += 1;
  } else {
    teams[team2].wins += 1;
    teams[team2].points += 2;
    teams[team1].losses += 1;
    teams[team1].points += 1;
  }

  // Sačuvaj rezultat u memoriju samo za grupnu fazu
  const gameResult = { winner: result.winner, loser: result.loser, team1Score: score1, team2Score: score2 };
  if (isGroupStage) {
    groupStageResults[matchupKey] = gameResult;
  }

  return gameResult;
}


function rankTeams(group) {
  const sortedTeams = groups[group].map(team => teams[team.ISOCode]); // Dodao si mu ažurirane podatke
  // sa utakmicama i bodovima, a ne da ostane početni Teams, koji ima samo atribute bez vrednosti
  sortedTeams.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.diff !== a.diff) return b.diff - a.diff;
    return b.scoreFor - a.scoreFor;
  });

  return sortedTeams;
}

// Proverava da li timovi mogu igrati međusobno u četvrtfinalu
function canPlay(team1, team2) {
  return teams[team1].group !== teams[team2].group;
}

function drawMatch(pot1, pot2) {
  for (let i = 0; i < pot1.length; i++) {
    for (let j = 0; j < pot2.length; j++) {
      if (canPlay(pot1[i], pot2[j])) {
        const match = [pot1[i], pot2[j]];
        pot1.splice(i, 1);
        pot2.splice(j, 1);
        return match;
      }
    }
  }
  
  // Ako nije moguće naći par koji zadovoljava uslov, izaberi prvi dostupni par
  if (pot1.length > 0 && pot2.length > 0) {
    return [pot1.shift(), pot2.shift()];
  }
  
  return null;
}

function drawTeamsForQuarterfinals(qualifiedTeams) {
  const pots = [[], [], [], []];

  // Popuni šešire prema pozicijama
  for (let i = 0; i < qualifiedTeams.length; i++) {
    if (i < 2) pots[0].push(qualifiedTeams[i].ISOCode);
    else if (i < 4) pots[1].push(qualifiedTeams[i].ISOCode);
    else if (i < 6) pots[2].push(qualifiedTeams[i].ISOCode);
    else pots[3].push(qualifiedTeams[i].ISOCode);
  }
  
  console.log("\nŠeširi:");
  ["Šešir D", "Šešir E", "Šešir F", "Šešir G"].forEach((pot, index) => {
    console.log(`    ${pot}`);
    pots[index].forEach(teamCode => console.log(`        ${teams[teamCode].name}`));
  });
  
  const quarterfinals = [];
  quarterfinals.push(drawMatch(pots[0], pots[3]));
  quarterfinals.push(drawMatch(pots[1], pots[2]));
  quarterfinals.push(drawMatch(pots[0], pots[3]));
  quarterfinals.push(drawMatch(pots[1], pots[2]));
  
  console.log("\nEliminaciona faza:");
  quarterfinals.forEach(match => {
    if (match) {
      console.log(`    ${teams[match[0]].name} - ${teams[match[1]].name}`);
    }
  });

  return quarterfinals;
}

function rankTeamsByGroupCriteria(group) {
  const groupTeams = groups[group].map(team => teams[team.ISOCode]);

  // Rangiraj prema bodovima
  groupTeams.sort((a, b) => b.points - a.points);

  for (let i = 0; i < groupTeams.length - 1; i++) {
    for (let j = i + 1; j < groupTeams.length; j++) {
      // Ako dva ili više timova imaju isti broj bodova
      if (groupTeams[i].points === groupTeams[j].points) {
        const tiedTeams = [groupTeams[i], groupTeams[j]];

        // Provera da li postoje dodatni timovi sa istim brojem bodova
        for (let k = j + 1; k < groupTeams.length && groupTeams[k].points === groupTeams[i].points; k++) {
          tiedTeams.push(groupTeams[k]);
        }

        if (tiedTeams.length === 2) {
          // Slučaj kada su dva tima sa istim brojem bodova
          const team1Code = tiedTeams[0].ISOCode;
          const team2Code = tiedTeams[1].ISOCode;

          const matchupKey = [team1Code, team2Code].sort().join("-");
          const headToHeadResult = groupStageResults[matchupKey];

          if (headToHeadResult && headToHeadResult.winner === team2Code) {
            [groupTeams[i], groupTeams[j]] = [groupTeams[j], groupTeams[i]];
          }
        } else if (tiedTeams.length === 3) {
          // Slučaj kada su tri tima sa istim brojem bodova (tzv. formiranje kruga)
          let scoreDifferences = tiedTeams.map(team => ({
            team: team,
            diff: 0,
          }));

          // Izračunaj razliku u poenima u međusobnim utakmicama između tri tima
          for (let x = 0; x < tiedTeams.length; x++) {
            for (let y = x + 1; y < tiedTeams.length; y++) {
              const team1Code = tiedTeams[x].ISOCode;
              const team2Code = tiedTeams[y].ISOCode;

              const matchupKey = [team1Code, team2Code].sort().join("-");
              const headToHeadResult = groupStageResults[matchupKey];

              if (headToHeadResult) {
                if (headToHeadResult.winner === team1Code) {
                  scoreDifferences[x].diff += headToHeadResult.team1Score - headToHeadResult.team2Score;
                  scoreDifferences[y].diff -= headToHeadResult.team1Score - headToHeadResult.team2Score;
                } else {
                  scoreDifferences[y].diff += headToHeadResult.team2Score - headToHeadResult.team1Score;
                  scoreDifferences[x].diff -= headToHeadResult.team2Score - headToHeadResult.team1Score;
                }
              }
            }
          }

          // Sortiraj timove prema razlici u poenima
          scoreDifferences.sort((a, b) => b.diff - a.diff);

          // Ažuriraj redosled timova u grupi prema rezultatu formiranja kruga
          for (let x = 0; x < scoreDifferences.length; x++) {
            groupTeams[i + x] = scoreDifferences[x].team;
          }

          // Preskoči već obrađene timove u krugu
          j += tiedTeams.length - 1;
        }
      }
    }
  }

  return groupTeams;
}

// Simulacija i prikaz rezultata
Object.keys(groups).forEach(group => {  
  console.log(`Grupna faza - I kolo:\n    Grupa ${group}:`);
  const teamsInGroup = groups[group];

  for (let i = 0; i < teamsInGroup.length; i++) {
    for (let j = i + 1; j < teamsInGroup.length; j++) {
      let result;
      do {
        result = simulateGame(teamsInGroup[i].ISOCode, teamsInGroup[j].ISOCode, true);
      } while (result.team1Score === result.team2Score); // Ponovno generiši rezultate ako su nerešeni
      console.log(`        ${teamsInGroup[i].Team} - ${teamsInGroup[j].Team} (${result.team1Score}:${result.team2Score})`);
    }
  }

  const rankedTeams = rankTeamsByGroupCriteria(group);
  console.log(`\nKonačan plasman u grupi ${group}:`);
  rankedTeams.forEach((team, index) => {
    console.log(`    ${index + 1}. ${team.name} ${team.wins} / ${team.losses} / ${team.points} / ${team.scoreFor} / ${team.scoreAgainst} / ${team.diff}`);
  });
});

// Rangiranje timova iz grupa A, B, C
const firstPlaced = rankTeamsByGroupCriteria('A').slice(0, 1).concat(rankTeamsByGroupCriteria('B').slice(0, 1)).concat(rankTeamsByGroupCriteria('C').slice(0, 1));
const secondPlaced = rankTeamsByGroupCriteria('A').slice(1, 2).concat(rankTeamsByGroupCriteria('B').slice(1, 2)).concat(rankTeamsByGroupCriteria('C').slice(1, 2));
const thirdPlaced = rankTeamsByGroupCriteria('A').slice(2, 3).concat(rankTeamsByGroupCriteria('B').slice(2, 3)).concat(rankTeamsByGroupCriteria('C').slice(2, 3));

const allTeams = [...firstPlaced, ...secondPlaced, ...thirdPlaced];

const sortedTeams = allTeams.sort((a, b) => {
  if (b.points !== a.points) return b.points - a.points;
  if (b.diff !== a.diff) return b.diff - a.diff;
  return b.scoreFor - a.scoreFor;
});

console.log("\nRangiranje timova (1-9):");
sortedTeams.forEach((team, index) => {
  console.log(`    ${index + 1}. ${team.name} ${team.points} / ${team.diff} / ${team.scoreFor}`);
});

console.log("\nTimovi koji su prošli dalje (1-8):");
sortedTeams.slice(0, 8).forEach(team => {
  console.log(`    ${team.name}`);
});

console.log("\n------------------------------");
console.log("\nTim koji ne prolazi dalje (9):");
console.log(`    ${sortedTeams[8].name}`);

// Simulacija eliminacione faze
const quarterfinalMatches = drawTeamsForQuarterfinals(sortedTeams.slice(0, 8));

console.log("\nČetvrtfinale:");
const semifinalists = [];
quarterfinalMatches.forEach(match => {
  if (match) {
    const result = simulateGame(match[0], match[1], false);
    console.log(`    ${teams[match[0]].name} - ${teams[match[1]].name} (${result.team1Score}: ${result.team2Score})`);
    semifinalists.push(result.winner);
  }
});

console.log("\nPolufinale:");
const finalists = [];
const thirdPlaceCandidates = [];  // Gubitnici polufinala i učenici utakmice za bronzu tj. 3. mesto

for (let i = 0; i < semifinalists.length; i += 2) {
  const result = simulateGame(semifinalists[i], semifinalists[i + 1]);
  console.log(`    ${teams[semifinalists[i]].name} - ${teams[semifinalists[i + 1]].name} (${result.team1Score}: ${result.team2Score})`);
  finalists.push(result.winner);
  thirdPlaceCandidates.push(result.loser);  // Dodaj gubitnika u učesnike za treće mesto
}

// Simulacija utakmice za treće mesto
console.log("\nMeč za treće mesto:");
const thirdPlaceMatch = simulateGame(thirdPlaceCandidates[0], thirdPlaceCandidates[1], false);
console.log(`    ${teams[thirdPlaceCandidates[0]].name} - ${teams[thirdPlaceCandidates[1]].name} (${thirdPlaceMatch.team1Score}: ${thirdPlaceMatch.team2Score})`);

// Simulacija finalne utakmice
console.log("\nFinale:");
const finalMatch = simulateGame(finalists[0], finalists[1], false);
console.log(`    ${teams[finalists[0]].name} - ${teams[finalists[1]].name} (${finalMatch.team1Score}: ${finalMatch.team2Score})`);

// Prikaz osvojenih medalja
console.log("\nOsvojene medalje:");
console.log(`    Zlato: ${teams[finalMatch.winner].name}`);
console.log(`    Srebro: ${teams[finalMatch.loser].name}`);
console.log(`    Bronza: ${teams[thirdPlaceMatch.winner].name}`);