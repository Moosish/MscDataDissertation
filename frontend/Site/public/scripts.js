console.log('Script loaded'); // Add this at the top of scripts.js

document.addEventListener('DOMContentLoaded', function() {
    const fetchMatchesButton = document.getElementById('fetch-matches');
    const matchDateInput = document.getElementById('match-date');
    const matchResultsContainer = document.getElementById('match-results');

    // Function to load fixtures based on the selected date
    async function loadFixtures() {
        const selectedDate = matchDateInput.value;

        // Log the selected date for debugging purposes
        console.log('Selected Date:', selectedDate);

        // Check if a date is selected
        if (!selectedDate) {
            alert('Please select a date.');
            return;
        }

        try {
            // Clear previous results and show loading message
            matchResultsContainer.innerHTML = '<p>Loading matches...</p>';

            // Fetch matches for the selected date
            const response = await fetch(`/api/matches?date=${selectedDate}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch matches: ${response.statusText}`);
            }
            const data = await response.json();

            // Log the API response for debugging purposes
            console.log('API Response:', data);

            // Clear the loading message
            matchResultsContainer.innerHTML = '';

            if (data && data.matches && data.matches.length > 0) {
                // Organize matches by competition type
                const matchesByCompetition = organizeMatchesByCompetition(data.matches);

                // Render the matches on the page
                renderMatches(matchesByCompetition);
            } else {
                // No matches found for the selected date
                matchResultsContainer.innerHTML = '<p>No matches found for the selected date.</p>';
            }
        } catch (error) {
            console.error('Error fetching matches:', error);
            matchResultsContainer.innerHTML = '<p>Error loading matches. Please try again later.</p>';
        }
    }

    // Event listener for the Fetch Matches button
    fetchMatchesButton.addEventListener('click', loadFixtures);

    // Helper function to organize matches by competition type
    function organizeMatchesByCompetition(matches) {
        const matchesByCompetition = {};

        matches.forEach(match => {
            const competition = match.competition_type || 'Unknown Competition';
            if (!matchesByCompetition[competition]) {
                matchesByCompetition[competition] = [];
            }
            matchesByCompetition[competition].push(match);
        });

        return matchesByCompetition;
    }

    // Helper function to render the matches on the page
    function renderMatches(matchesByCompetition) {
        for (const competition in matchesByCompetition) {
            const competitionSection = document.createElement('div');
            competitionSection.className = 'competition-section';
            competitionSection.innerHTML = `<h2>${competition}</h2>`;

            matchesByCompetition[competition].forEach(match => {
                const matchElement = document.createElement('div');
                matchElement.className = 'fixture';
                matchElement.innerHTML = `
                    <div class="fixture-teams">
                        <span>${match.home_club_name}</span> vs <span>${match.away_club_name}</span>
                    </div>
                    <div class="fixture-info">
                        <span>${match.home_club_goals} - ${match.away_club_goals}</span>
                        <span>${match.stadium}</span>
                        <span>Round: ${match.round}</span>
                        <a href="${match.url}" target="_blank">Details</a>
                    </div>
                `;
                competitionSection.appendChild(matchElement);
            });

            matchResultsContainer.appendChild(competitionSection);
        }
    }
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

document.addEventListener('DOMContentLoaded', function () {
    const topics = document.querySelectorAll('.topic h3');

    topics.forEach(topic => {
        topic.addEventListener('click', function () {
            const parent = this.parentElement;
            parent.classList.toggle('expanded');
        });
    });
});