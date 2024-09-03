Olympic Games Basketball Tournament Simulation
This project is a JavaScript program designed to simulate a basketball tournament at the Olympic Games in Paris 2024, following the official rules and structure of the competition. The simulation covers both the group stage and the knockout stage, accurately reflecting the dynamics of an international basketball tournament.

Group Stage
Team Grouping: Teams are divided into three groups, as specified in the groups.json file, each consisting of four teams.
Match Simulation: Each team competes against every other team in their group, with match outcomes influenced by the teams' FIBA rankings.
Scoring System:
2 points are awarded for a win.
1 point for a loss.
0 points for a forfeit.
Ranking Criteria:
Teams are ranked based on their total points.
In case of a tie on points, head-to-head results determine the ranking.
For three-way ties, point differences in matches between the tied teams are used.
Advancement: The top three teams from each group are ranked, with the best 8 teams advancing to the knockout stage. The 9th team is eliminated from the tournament.
Knockout Stage
Quarterfinals: The advancing teams are placed into four seeded pairs:
Teams ranked 1st and 2nd are placed in Pot D.
Teams ranked 3rd and 4th in Pot E.
Teams ranked 5th and 6th in Pot F.
Teams ranked 7th and 8th in Pot G.
Matchups: Teams from Pot D are matched with teams from Pot G, and teams from Pot E are matched with teams from Pot F, avoiding rematches from the group stage.
Progression:
Winners of the quarterfinals advance to the semifinals.
Semifinal winners compete in the final.
The semifinal losers play in a bronze medal match.
Final Results: The tournament concludes with the awarding of gold, silver, and bronze medals to the top three teams.
Additional Features
Team Form Factor: The program optionally adjusts match outcomes based on the teams' performance in two exhibition games, as recorded in the exibitions.json file.
Dynamic Simulation: The team’s form can be adjusted as the tournament progresses, incorporating the strength of opponents and the margin of victory or defeat in previous matches.
Running the Project
The project is executed using Node.js (v20.17.0) by running the command npm start in the terminal.
The output displays the simulated results of each match in both the group and knockout stages, along with final rankings and medal winners.
