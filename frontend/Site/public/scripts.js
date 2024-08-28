console.log('Script loaded'); // Add this at the top of scripts.js

document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const matchId = urlParams.get('match_id');

    if (!matchId) {
        document.getElementById('match-details').textContent = 'Match not found';
        return;
    }

    try {
        // Fetch match and lineup data from the API
        const response = await fetch(`/api/match/${matchId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch match data');
        }

        const data = await response.json();
        displayMatchData(data.matchData);
        
        if (data.lineups) {
            displayLineupsData(data.lineups);
        } else {
            document.getElementById('lineups-container').innerHTML = '<p>No lineups found for this match.</p>';
        }

    } catch (error) {
        console.error('Error fetching match or lineups data:', error);
        document.getElementById('match-details').textContent = 'Error loading match data';
    }
});

function displayMatchData(matchData) {
    const matchDetails = document.getElementById('match-details');
    matchDetails.innerHTML = `
        <h2>${matchData.home_club_name} vs ${matchData.away_club_name}</h2>
        <p><strong>Date:</strong> ${matchData.date}</p>
        <p><strong>Competition:</strong> ${matchData.competition_type}</p>
        <p><strong>Stadium:</strong> ${matchData.stadium}</p>
        <p><strong>Score:</strong> ${matchData.home_club_goals} - ${matchData.away_club_goals}</p>
        <p><strong>Round:</strong> ${matchData.round}</p>
    `;
}

function displayMatchData(matchData) {
    const matchDetails = document.getElementById('match-details');
    matchDetails.innerHTML = `
        <h2>${matchData.home_club_name} vs ${matchData.away_club_name}</h2>
        <p><strong>Date:</strong> ${matchData.date}</p>
        <p><strong>Competition:</strong> ${matchData.competition_type}</p>
        <p><strong>Stadium:</strong> ${matchData.stadium}</p>
        <p><strong>Score:</strong> ${matchData.home_club_goals} - ${matchData.away_club_goals}</p>
        <p><strong>Round:</strong> ${matchData.round}</p>
    `;
}

function displayLineupsData(lineups) {
    const homeTeamLineups = document.getElementById('home-team-lineups');
    const awayTeamLineups = document.getElementById('away-team-lineups');

    // Clear existing content
    homeTeamLineups.innerHTML = '';
    awayTeamLineups.innerHTML = '';

    if (!lineups || lineups.length === 0) {
        console.log('No lineups available.');
        return;
    }

    // Extract the first match's home and away club IDs for grouping
    const homeClubId = lineups[0].home_club_id;
    const awayClubId = lineups[0].away_club_id;

    // Group lineups by club and type
    const homeStarting = lineups.filter(player => player.club_id === homeClubId && player.type === 'starting_lineup');
    const homeSubstitutes = lineups.filter(player => player.club_id === homeClubId && player.type === 'substitutes');
    
    const awayStarting = lineups.filter(player => player.club_id === awayClubId && player.type === 'starting_lineup');
    const awaySubstitutes = lineups.filter(player => player.club_id === awayClubId && player.type === 'substitutes');

    // Create sections for home team
    createTeamSection(homeTeamLineups, 'Home Team: Starting Lineup', homeStarting);
    createTeamSection(homeTeamLineups, 'Home Team: Substitutes', homeSubstitutes);

    // Create sections for away team
    createTeamSection(awayTeamLineups, 'Away Team: Starting Lineup', awayStarting);
    createTeamSection(awayTeamLineups, 'Away Team: Substitutes', awaySubstitutes);
}

function createTeamSection(container, title, players) {
    if (players.length === 0) return;

    const section = document.createElement('div');
    section.className = 'lineup-subsection';
    section.innerHTML = `<h3>${title}</h3>`;

    players.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'lineup-card';
        playerCard.innerHTML = `
            <h4>${player.player_name}</h4>
            <p><strong>Position:</strong> ${player.position}</p>
            <p><strong>Type:</strong> ${player.type}</p>
            <p><strong>Team Captain:</strong> ${player.team_captain ? 'Yes' : 'No'}</p>
        `;
        section.appendChild(playerCard);
    });

    container.appendChild(section);
}





document.getElementById('theme-toggle-btn').addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');

    // Optionally, save the theme preference in local storage
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});

// On page load, check the user's saved preference
window.onload = function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const topics = document.querySelectorAll('.topic h3');

    topics.forEach(topic => {
        topic.addEventListener('click', function () {
            const parent = this.parentElement;
            parent.classList.toggle('expanded');
        });
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const expandButtons = document.querySelectorAll('.btn-expand');

    expandButtons.forEach(button => {
        button.addEventListener('click', function () {
            const viewDetails = this.nextElementSibling;
            if (viewDetails.style.display === 'none' || viewDetails.style.display === '') {
                viewDetails.style.display = 'block';
                this.textContent = 'Collapse';
            } else {
                viewDetails.style.display = 'none';
                this.textContent = 'Expand';
            }
        });
    });

    // Handle form submission
    document.getElementById('scouting-form').addEventListener('submit', function (event) {
        event.preventDefault();
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const loadMatchEventsButton = document.getElementById('load-match-events');
    const playButton = document.getElementById('play-button');
    const matchDropdown = document.getElementById('match-dropdown');
    let events = []; // Global array to store match events
    let homeStats = {};
    let awayStats = {};
    let currentEventIndex = 0;
    let playbackInterval = null; // To store the interval reference
        let homeTeamName = ''; // Store the home team name
    let awayTeamName = ''; // Store the away team name

    // Function to load match events
    async function loadMatchEvents() {
        const selectedFile = matchDropdown.value;

        // Check if a match is selected
        if (!selectedFile) {
            alert('Please select a match.');
            return;
        }

        try {
            console.log(`Fetching match events for file: ${selectedFile}`);
            // Fetch match events
            const response = await fetch(`/api/matches/events?file=${encodeURIComponent(selectedFile)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch match events');
            }
            events = await response.json(); // Set the global events array
            console.log('Match events loaded:', events); // Log loaded events
            currentEventIndex = 0;
            // Extract team names from the first two events
            if (events.length >= 2) {
                homeTeamName = events[0].team.name;
                awayTeamName = events[1].team.name;
                console.log(`Home Team: ${homeTeamName}, Away Team: ${awayTeamName}`);
            } else {
                console.error('Not enough events to determine team names.');
                return;
            }
           // resetStats(); // Reset stats before starting playback

            if (events.length > 0) {
                alert('Match events loaded successfully. You can now press play to start playback.');
            } else {
                alert('No events found in the match file.');
            }

        } catch (error) {
            console.error('Error fetching match events:', error);
        }
    }

      // Function to get events up to the current index
      function getEventsUpToCurrentIndex() {
        return events.slice(0, currentEventIndex + 1);
    }

    // Function to fetch substitution prediction
    async function fetchSubstitutionPrediction() {
        const eventsUpToNow = getEventsUpToCurrentIndex();

        try {
            const response = await fetch('https://substitution-model-mugnutap5q-uc.a.run.app/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ events: eventsUpToNow })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch substitution prediction');
            }

            const prediction = await response.json();
            displaySubstitutionPrediction(prediction);
        } catch (error) {
            console.error('Error fetching substitution prediction:', error);
        }
    }

    // Function to display substitution prediction
    function displaySubstitutionPrediction(prediction) {
        console.log(prediction)
        document.getElementById('home-substitution-prediction').textContent = prediction.team_1_substitution_probability + '%';
        document.getElementById('away-substitution-prediction').textContent = prediction.team_2_substitution_probability + '%';
    }

    async function fetchTacticalShiftPrediction(events) {
        const eventsUpToNow = getEventsUpToCurrentIndex();
        try {
            const response = await fetch('https://tactical-model-mugnutap5q-uc.a.run.app/predict-tactical-shift', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ events: eventsUpToNow })
            });
            
    
            // Ensure the response is valid and check for success status
            if (!response.ok) {
                console.error("API call failed with status:", response.status);
                return;
            }
    
            const result = await response.json();

            console.log(result);
    
            // Validate the response content
            if (!result || typeof result !== 'object') {
                console.error("Invalid response format:", result);
                return;
            }
    
            // Ensure the fields are defined in the response
            const team1ShiftProbability = result.team_1_tactical_shift_probability;
            const team2ShiftProbability = result.team_2_tactical_shift_probability;
    
            if (team1ShiftProbability === undefined || team2ShiftProbability === undefined) {
                console.error("Response does not contain tactical shift probabilities:", result);
                return;
            }
    
            // Update the UI with the fetched data
            document.getElementById('home-tactical-shift-probability').textContent = `${(team1ShiftProbability * 100).toFixed(2)}%`;
            document.getElementById('away-tactical-shift-probability').textContent = `${(team2ShiftProbability * 100).toFixed(2)}%`;
    
        } catch (error) {
            console.error("Error fetching tactical shift prediction:", error);
        }
    }
    

// Call this function when you want to update the predictions
fetchTacticalShiftPrediction(events)
    .then(result => {
        document.getElementById('home-tactical-shift-probability').textContent = result.team_1_tactical_shift_probability + '%';
        document.getElementById('away-tactical-shift-probability').textContent = result.team_2_tactical_shift_probability + '%';
    })
    .catch(error => console.error('Error fetching tactical shift prediction:', error));


    // Function to update stats display
function updateStatsDisplay(homeStats, awayStats) {
    // Update stats on the page, e.g.:
    document.getElementById('home-team').textContent = homeTeamName;
    document.getElementById('home-possession').textContent = homeStats.possession.toFixed(2) + '%';
    document.getElementById('home-shots').textContent = homeStats.shots;
    document.getElementById('home-shots-on-target').textContent = homeStats.shotsOnTarget;
    document.getElementById('home-expected-goals').textContent = homeStats.expectedGoals.toFixed(2);
    document.getElementById('home-accurate-passes').textContent = `${homeStats.accuratePasses}`;
    document.getElementById('home-goals').textContent = homeStats.goals;
    document.getElementById('home-big-chances').textContent = homeStats.bigChances;
    document.getElementById('home-big-chances-missed').textContent = homeStats.bigChancesMissed;
    document.getElementById('home-fouls-committed').textContent = homeStats.foulsCommitted;
    document.getElementById('home-corners').textContent = homeStats.corners;
    document.getElementById('home-blocked-shots').textContent = homeStats.blockedShots;
    document.getElementById('home-touches-opposition-box').textContent = homeStats.touchesOppositionBox;
    document.getElementById('home-yellow-cards').textContent = homeStats.yellowCards;
    document.getElementById('home-red-cards').textContent = homeStats.redCards;
    document.getElementById('home-tackles-won').textContent = homeStats.tacklesWon;
    document.getElementById('home-interceptions').textContent = homeStats.interceptions;
    document.getElementById('home-clearances').textContent = homeStats.clearances;
    document.getElementById('home-keeper-saves').textContent = homeStats.keeperSaves;

    document.getElementById('away-team').textContent = awayTeamName;
    document.getElementById('away-possession').textContent = awayStats.possession.toFixed(2) + '%';
    document.getElementById('away-shots').textContent = awayStats.shots;
    document.getElementById('away-shots-on-target').textContent = awayStats.shotsOnTarget;
    document.getElementById('away-expected-goals').textContent = awayStats.expectedGoals.toFixed(2);
    document.getElementById('away-accurate-passes').textContent = `${awayStats.accuratePasses} `;
    document.getElementById('away-goals').textContent = awayStats.goals;
    document.getElementById('away-big-chances').textContent = awayStats.bigChances;
    document.getElementById('away-big-chances-missed').textContent = awayStats.bigChancesMissed;
    document.getElementById('away-fouls-committed').textContent = awayStats.foulsCommitted;
    document.getElementById('away-corners').textContent = awayStats.corners;
    document.getElementById('away-blocked-shots').textContent = awayStats.blockedShots;
    document.getElementById('away-touches-opposition-box').textContent = awayStats.touchesOppositionBox;
    document.getElementById('away-yellow-cards').textContent = awayStats.yellowCards;
    document.getElementById('away-red-cards').textContent = awayStats.redCards;
    document.getElementById('away-tackles-won').textContent = awayStats.tacklesWon;
    document.getElementById('away-interceptions').textContent = awayStats.interceptions;
    document.getElementById('away-clearances').textContent = awayStats.clearances;
    document.getElementById('away-keeper-saves').textContent = awayStats.keeperSaves;

    // You can add more stat fields here if needed.
}

// Function to reset stats to initial state
function resetStats() {
    const initialStats = {
        possession: 0,
        shots: 0,
        shotsOnTarget: 0,
        expectedGoals: 0,
        accuratePasses: 0,
        passAccuracy: 'NaN',
        goals: 0,
        bigChances: 0,
        bigChancesMissed: 0,
        foulsCommitted: 0,
        corners: 0,
        blockedShots: 0,
        touchesOppositionBox: 0,
        yellowCards: 0,
        redCards: 0,
        tacklesWon: 0,
        interceptions: 0,
        clearances: 0,
        keeperSaves: 0
    };

    homeStats = { ...initialStats };
    awayStats = { ...initialStats };
    updateStatsDisplay(homeStats, awayStats);
}


    // Function to process events and display them as cards
    function processEvent(event) {
        console.log('Processing event:', event); // Log the event being processed
    
        if (!event || typeof event !== 'object') return;
    
        // Safely access the event properties
        const eventType = event.type ? event.type.name : 'Unknown Event';
        const eventTeam = event.team ? event.team.name : 'Unknown Team'; // Assuming `team` is an object with a `name` property
        const playerName = event.player ? event.player.name : 'Unknown Player';
        const eventDetail = event.play_pattern ? event.play_pattern.name : 'No additional details';
        // Update stats based on the event type
        switch (eventType) {
            case 'Goal':
                if (eventTeam === homeTeamName) {
                    homeStats.goals += 1;
                } else if (eventTeam === awayTeamName) {
                    awayStats.goals += 1;
                }
                break;
        
            case 'Shot':
                if (eventTeam === homeTeamName) {
                    homeStats.shots += 1;
                    if (eventDetail === 'On Target') {
                        homeStats.shotsOnTarget += 1;
                    }
                } else if (eventTeam === awayTeamName) {
                    awayStats.shots += 1;
                    if (eventDetail === 'On Target') {
                        awayStats.shotsOnTarget += 1;
                    }
                }
                break;
        
            case 'Pass':
                if (eventTeam === homeTeamName) {
                    homeStats.accuratePasses += 1; // Assuming all passes are accurate
                } else if (eventTeam === awayTeamName) {
                    awayStats.accuratePasses += 1; // Assuming all passes are accurate
                }
                break;
        
            case 'Foul Committed':
                if (eventTeam === homeTeamName) {
                    homeStats.foulsCommitted += 1;
                } else if (eventTeam === awayTeamName) {
                    awayStats.foulsCommitted += 1;
                }
                break;
        
            case 'Foul Won':
                if (eventTeam === homeTeamName) {
                    homeStats.foulsWon += 1;
                } else if (eventTeam === awayTeamName) {
                    awayStats.foulsWon += 1;
                }
                break;
        
            case 'Corner':
                if (eventTeam === homeTeamName) {
                    homeStats.corners += 1;
                } else if (eventTeam === awayTeamName) {
                    awayStats.corners += 1;
                }
                break;
        
            case 'Save':
                if (eventTeam === homeTeamName) {
                    homeStats.keeperSaves += 1;
                } else if (eventTeam === awayTeamName) {
                    awayStats.keeperSaves += 1;
                }
                break;
        
            case 'Clearance':
                if (eventTeam === homeTeamName) {
                    homeStats.clearances += 1;
                } else if (eventTeam === awayTeamName) {
                    awayStats.clearances += 1;
                }
                break;
        
            case 'Tackle':
                if (eventTeam === homeTeamName) {
                    homeStats.tacklesWon += 1;
                } else if (eventTeam === awayTeamName) {
                    awayStats.tacklesWon += 1;
                }
                break;
        
            case 'Ball Recovery':
                if (eventTeam === homeTeamName) {
                    homeStats.ballRecoveries += 1;
                } else if (eventTeam === awayTeamName) {
                    awayStats.ballRecoveries += 1;
                }
                break;
        
            case 'Interception':
                if (eventTeam === homeTeamName) {
                    homeStats.interceptions += 1;
                } else if (eventTeam === awayTeamName) {
                    awayStats.interceptions += 1;
                }
                break;
        
            case 'Dribble':
                if (eventTeam === homeTeamName) {
                    homeStats.dribbles += 1;
                } else if (eventTeam === awayTeamName) {
                    awayStats.dribbles += 1;
                }
                break;
        
            case 'Ball Receipt*':
                // You can add custom logic here if necessary
                break;
        
            case 'Block':
                if (eventTeam === homeTeamName) {
                    homeStats.blocks += 1;
                } else if (eventTeam === awayTeamName) {
                    awayStats.blocks += 1;
                }
                break;
        
            case 'Carry':
                if (eventTeam === homeTeamName) {
                    homeStats.carries += 1;
                } else if (eventTeam === awayTeamName) {
                    awayStats.carries += 1;
                }
                break;
        
            case 'Dispossessed':
                if (eventTeam === homeTeamName) {
                    homeStats.dispossessions += 1;
                } else if (eventTeam === awayTeamName) {
                    awayStats.dispossessions += 1;
                }
                break;
        
            case 'Dribbled Past':
                if (eventTeam === homeTeamName) {
                    homeStats.dribbledPast += 1;
                } else if (eventTeam === awayTeamName) {
                    awayStats.dribbledPast += 1;
                }
                break;
        
            case 'Duel':
                if (eventTeam === homeTeamName) {
                    homeStats.duels += 1;
                } else if (eventTeam === awayTeamName) {
                    awayStats.duels += 1;
                }
                break;
        
            case 'Goal Keeper':
                // Logic for goalkeeper events can be added here if necessary
                break;
        
            case 'Half End':
            case 'Half Start':
                // These are more structural events, no need to update stats
                break;
        
            case 'Miscontrol':
                if (eventTeam === homeTeamName) {
                    homeStats.miscontrols += 1;
                } else if (eventTeam === awayTeamName) {
                    awayStats.miscontrols += 1;
                }
                break;
        
            case 'Offside':
                if (eventTeam === homeTeamName) {
                    homeStats.offsides += 1;
                } else if (eventTeam === awayTeamName) {
                    awayStats.offsides += 1;
                }
                break;
        
            case 'Player Off':
            case 'Player On':
                // Substitutions, usually no impact on stats here, but can track substitutions
                break;
        
            case 'Pressure':
                if (eventTeam === homeTeamName) {
                    homeStats.pressures += 1;
                } else if (eventTeam === awayTeamName) {
                    awayStats.pressures += 1;
                }
                break;
        
            case 'Shield':
                // Logic for shielding events can be added here if necessary
                break;
        
            case 'Starting XI':
            case 'Substitution':
            case 'Tactical Shift':
                // These events may not impact stats but are more structural or tactical
                break;
        
            // Add more cases here as you refine the event types and their impact on stats
        }
        
    
        // Update possession percentage (simplified example, needs real-time calculation)
        homeStats.possession = calculatePossession(homeStats, awayStats);
    
        // Update the stats display
        updateStatsDisplay(homeStats, awayStats);
    
        // Create a card for the event
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
    
        // Format the event details
        eventCard.innerHTML = `
            <h4>${event.timestamp || 'Unknown Time'}: ${eventType}</h4>
            <p><strong>Team:</strong> ${eventTeam}</p>
            <p><strong>Player:</strong> ${playerName}</p>
            <p><strong>Details:</strong> ${eventDetail}</p>
        `;
    
        // Add the card to the top of the event list
        const eventsContainer = document.getElementById('events-container');
        if (eventsContainer) {
            eventsContainer.prepend(eventCard);
        } else {
            console.error('No container found for events.');
        }
        fetchSubstitutionPrediction();
        fetchTacticalShiftPrediction();
    }
    
    function calculatePossession(homeStats, awayStats) {
        const totalPasses = homeStats.accuratePasses + awayStats.accuratePasses;
        if (totalPasses === 0) return 50; // If no passes, assume equal possession
        awayStats.possession = (awayStats.accuratePasses / totalPasses) * 100;
        return (homeStats.accuratePasses / totalPasses) * 100;
    }
    
    // Function to play the match events
    function playEvents() {
        console.log('Attempting to play events:', events); // Log the events array

        if (events.length === 0) {
            alert('No events to play. Please load match events first.');
            return;
        }

        resetStats(); // Reset stats before starting playback

        playbackInterval = setInterval(() => {
            if (currentEventIndex < events.length) {
                processEvent(events[currentEventIndex]);
                currentEventIndex++;
            } else {
                clearInterval(playbackInterval);
                console.log('All events processed.');
            }
        }, 1000); // Adjust playback speed as needed
    }


    // Event listener for play button
    playButton.addEventListener('click', playEvents);

    // Event listener for the "Load Match Events" button
    loadMatchEventsButton.addEventListener('click', loadMatchEvents);

    // Initialize with default stats

    const expandStatsButton = document.getElementById('expand-stats-button');
    const hiddenStats = document.getElementById('hidden-stats');

    // Toggle hidden stats visibility
    expandStatsButton.addEventListener('click', function () {
        if (hiddenStats.style.display === 'none' || hiddenStats.style.display === '') {
            hiddenStats.style.display = 'block';
            expandStatsButton.textContent = 'Collapse Stats';
        } else {
            hiddenStats.style.display = 'none';
            expandStatsButton.textContent = 'Expand Stats';
        }
    });
});







document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const playerId = urlParams.get('player_id');

    if (!playerId) {
        document.getElementById('player-name').textContent = 'Player not found';
        return;
    }

    try {
        // Fetch player data from the API
        const response = await fetch(`/api/player/${playerId}`);
        if (!response.ok) {
            console.error('Failed to fetch player data:', response.statusText);
            document.getElementById('player-name').textContent = 'Error loading player data';
            return;
        }

        const player = await response.json();

        // Display basic player info
        document.getElementById('player-name').textContent = player.name || 'Unknown Player';
        document.getElementById('player-basic-info').innerHTML = `
            <p>Date of Birth: ${player.date_of_birth?.value || 'N/A'}</p>
            <p>Place of Birth: ${player.country_of_birth || 'N/A'}</p>
            <p>Height: ${player.height_in_cm || 'N/A'} cm</p>
        `;

        // Display player image
        const playerImage = document.getElementById('player-image');
        if (player.image_url) {
            playerImage.src = player.image_url;
        } else {
            playerImage.src = 'default-image.png'; // Fallback if image not available
        }

        // Fetch similar players from the external API
        try {
            const similarPlayersResponse = await fetch(`https://playerknn-mugnutap5q-uc.a.run.app/similar-players?player_name=${encodeURIComponent(player.name)}&num_similar=5`);
            if (!similarPlayersResponse.ok) {
                console.error('Failed to fetch similar players:', similarPlayersResponse.statusText);
                return;
            }

            const similarPlayers = await similarPlayersResponse.json();

            // Ensure the similar players list exists
            const similarPlayersList = document.getElementById('similar-players-list');
            if (!similarPlayersList) {
                console.error('Element #similar-players-list not found in the DOM');
                return;
            }

            // Clear any existing content in the similar players list
            similarPlayersList.innerHTML = '';

            // Display similar players with links
            for (const p of similarPlayers) {
                // Fetch player ID from the backend for the player name
                const playerIdResponse = await fetch(`/api/player-id?name=${encodeURIComponent(p.Player)}`);
                if (!playerIdResponse.ok) {
                    console.error(`Failed to fetch player ID for ${p.Player}`);
                    continue;
                }
                const { player_id } = await playerIdResponse.json();

                const listItem = document.createElement('li');
                const playerLink = document.createElement('a');
                playerLink.href = `/player.html?player_id=${player_id}`;
                playerLink.textContent = p.Player;
                listItem.appendChild(playerLink);
                similarPlayersList.appendChild(listItem);
            }
        } catch (error) {
            console.error('Error fetching similar players:', error);
        }

        // Categorize and display stats
        displayStatsByCategory(player.stats);

    } catch (error) {
        console.error('Error fetching player data:', error);
        document.getElementById('player-name').textContent = 'Error loading player data';
    }
});



function displayStatsByCategory(stats) {
    const performanceStats = {
        'Goals': stats['Performance - Gls'],
        'Assists': stats['Performance - Ast'],
        'Goals + Assists': stats['Performance - G+A'],
        'Non Penalty Goals': stats['Performance - G-PK'],
        'Penalties Taken': stats['Performance - PK'],
        'Yellow Cards': stats['Performance - CrdY'],
        'Red Cards': stats['Performance - CrdR']
    };

    const expectedStats = {
        'xG': stats['Expected - xG'],
        'npxG': stats['Expected - npxG'],
        'xAG': stats['Expected - xAG'],
        'npxG + xAG': stats['Expected - npxG+xAG']
    };

    const progressionStats = {
        'Progressive Carries': stats['Progression - PrgC'],
        'Progressive Passes': stats['Progression - PrgP'],
        'Progressive Runs': stats['Progression - PrgR']
    };

    const per90Stats = {
        'Goals per 90': stats['Per 90 Minutes - Gls'],
        'Assists per 90': stats['Per 90 Minutes - Ast'],
        'Goals + Assists per 90': stats['Per 90 Minutes - G+A'],
        'xG per 90': stats['Per 90 Minutes - xG'],
        'xAG per 90': stats['Per 90 Minutes - xAG']
    };

    const standardStats = {
        'Shots': stats['Standard - Sh'],
        'Shots on Target': stats['Standard - SoT'],
        'Shots on Target %': stats['Standard - SoT%'],
        'Goals per Shot': stats['Standard - G_Sh'],
        'Goals per Shot on Target': stats['Standard - G_SoT']
    };

    const passingStats = {
        'Total Passes Completed': stats['Total - Cmp'],
        'Total Passes Attempted': stats['Total - Att'],
        'Passing Accuracy %': stats['Total - Cmp%']
    };

    const defensiveStats = {
        'Tackles': stats['Tackles - Tkl'],
        'Interceptions': stats['Int'],
        'Clearances': stats['Clr'],
        'Blocks': stats['Blocks - Blocks']
    };

    const possessionStats = {
        'Touches': stats['Touches - Touches'],
        'Take-Ons Attempted': stats['Take-Ons - Att'],
        'Take-Ons Successful': stats['Take-Ons - Succ']
    };

    renderStats(performanceStats, 'performance-stats');
    renderStats(expectedStats, 'expected-stats');
    renderStats(progressionStats, 'progression-stats');
    renderStats(per90Stats, 'per90-stats');
    renderStats(standardStats, 'standard-stats');
    renderStats(passingStats, 'passing-stats');
    renderStats(defensiveStats, 'defensive-stats');
    renderStats(possessionStats, 'possession-stats');
}

function renderStats(stats, elementId) {
    const statsContainer = document.getElementById(elementId);
    let statsHTML = '<table>';

    for (const [key, value] of Object.entries(stats)) {
        statsHTML += `<tr><td>${key}</td><td>${value || 'N/A'}</td></tr>`;
    }

    statsHTML += '</table>';
    statsContainer.innerHTML = statsHTML;
}


function createPlayerStatsChart(stats) {
    const ctx = document.getElementById('player-stats-chart').getContext('2d');

    // Example visualization: Bar chart of a few key stats
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Assists', 'Tackles', 'SCA', 'GCA', 'xAG'],
            datasets: [{
                label: 'Player Stats (2023-2024)',
                data: [
                    stats.Ast || 0,
                    stats['Tackles - Tkl'] || 0,
                    stats['SCA - SCA'] || 0,
                    stats['GCA - GCA'] || 0,
                    stats.xAG || 0
                ],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}


document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const playerId = urlParams.get('player_id'); // Extract player_id from the URL

    console.log(`Fetching data for player ID: ${playerId}`); // Log the player ID

    if (playerId) {
        try {
            // Fetch player data from the backend API
            const response = await fetch(`/api/player/${playerId}`);
            console.log('API Response:', response); // Log the raw response

            if (response.ok) {
                const playerData = await response.json();
                console.log('Player Data:', playerData); // Log the parsed JSON data
                displayPlayerData(playerData); // Display the player data on the page
            } else {
                console.error('Player not found');
                document.querySelector('h1').textContent = 'Player Not Found';
            }
        } catch (error) {
            console.error('Error fetching player data:', error);
        }
    }
    });

function displayPlayerData(player) {
    console.log('Displaying player data:', player); // Log the player data

    // Update player overview
    document.getElementById('player-name').textContent = `Player Profile - ${player.name || 'N/A'}`;
    document.getElementById('player-image').src = player.image_url || 'default-image.png';
    document.getElementById('position').innerHTML = `<strong>Position:</strong> ${player.position || 'N/A'} - ${player.sub_position || 'N/A'}`;
    document.getElementById('current-club').textContent = `Current Club: ${player.current_club_name || 'N/A'}`;

    // Update personal information
    document.getElementById('dob').textContent = `Date of Birth: ${player.date_of_birth?.value || 'N/A'}`;
    document.getElementById('height').textContent = `Height: ${player.height_in_cm || 'N/A'} cm`;
    document.getElementById('nationality').textContent = `Nationality: ${player.country_of_birth || 'N/A'}`;
    document.getElementById('city-of-birth').textContent = `City of Birth: ${player.city_of_birth || 'N/A'}`;
    document.getElementById('dominant-foot').textContent = `Dominant Foot: ${player.foot || 'N/A'}`;

    // Update club information
    document.getElementById('current-club-info').textContent = `Current Club: ${player.current_club_name || 'N/A'}`;
    document.getElementById('domestic-competition').textContent = `Domestic Competition: ${player.current_club_domestic_competition_id || 'N/A'}`;
    document.getElementById('contract-expiration').textContent = `Contract Expiration: ${player.contract_expiration_date || 'N/A'}`;

    // Update career information
    document.getElementById('last-season').textContent = `Last Season Played: ${player.last_season || 'N/A'}`;
    document.getElementById('player-code').textContent = `Player Code: ${player.player_code || 'N/A'}`;
    document.getElementById('agent-name').textContent = `Agent: ${player.agent_name || 'N/A'}`;

    // Update market value
    document.getElementById('current-market-value').textContent = `Current Market Value: €${player.market_value_in_eur || 'N/A'}`;
    document.getElementById('highest-market-value').textContent = `Highest Market Value: €${player.highest_market_value_in_eur || 'N/A'}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const fetchMatchesButton = document.getElementById('fetch-matches');
    const matchDateInput = document.getElementById('match-date');
    const matchResults = document.getElementById('match-results');

    fetchMatchesButton.addEventListener('click', async () => {
        const selectedDate = matchDateInput.value;
        
        if (!selectedDate) {
            alert('Please select a date.');
            return;
        }

        try {
            // Fetch matches for the selected date
            const response = await fetch(`/api/matches?date=${selectedDate}`);
            const data = await response.json();

            // Clear previous match results
            matchResults.innerHTML = '';

            if (data.matches.length === 0) {
                matchResults.innerHTML = '<p>No matches found for the selected date.</p>';
                return;
            }

            // Create cards for each match
            data.matches.forEach(match => {
                const card = document.createElement('div');
                card.className = 'match-card';

                // Construct the match details link
                const matchLink = `/match.html?match_id=${match.game_id}`;

                card.innerHTML = `
                    <h3>${match.home_club_name} vs. ${match.away_club_name}</h3>
                    <p><strong>Date:</strong> ${match.date}</p>
                    <p><strong>Stadium:</strong> ${match.stadium}</p>
                    <p><strong>Score:</strong> ${match.home_club_goals} - ${match.away_club_goals}</p>
                    <a href="${matchLink}" class="match-link">View Match Details</a>
                `;

                matchResults.appendChild(card);
            });

        } catch (error) {
            console.error('Error fetching matches:', error);
            matchResults.innerHTML = '<p>Failed to fetch matches. Please try again later.</p>';
        }
    });
});





async function populateDropdown() {
    try {
        const response = await fetch('/api/matches/list'); // Adjust to your API endpoint
        const data = await response.json();
        
        const dropdown = document.getElementById('match-dropdown');
        dropdown.innerHTML = ''; // Clear existing options

        data.matches.forEach(match => {
            const option = document.createElement('option');
            option.value = match.fileName; // Use the file name as the value
            option.textContent = match.matchTitle; // Use the match title as the display text
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching matches:', error);
        const dropdown = document.getElementById('match-dropdown');
        dropdown.innerHTML = '<option value="">Error loading matches</option>';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const matchDropdown = document.getElementById('match-dropdown');

    if (!matchDropdown) {
        console.error('Dropdown element not found!');
        return;  // Exit if the dropdown is not found
    }

    async function fetchMatches() {
        try {
            const response = await fetch('/api/all-matches');
            if (!response.ok) {
                throw new Error('Failed to fetch matches');
            }
            const matches = await response.json();

            // Populate the dropdown with matches
            matches.forEach(match => {
                const option = document.createElement('option');
                option.value = match.file;  // Assuming 'file' is the unique identifier for the match
                option.textContent = match.title;  // Assuming 'title' is the name to display in the dropdown
                matchDropdown.appendChild(option);  // Append the option to the dropdown
            });
        } catch (error) {
            console.error('Error fetching matches:', error);
        }
    }

    fetchMatches();  // Call the function to fetch matches and populate the dropdown
});

