const path = require('path');
const { BigQuery } = require('@google-cloud/bigquery');
const bigquery = new BigQuery();
const PORT = process.env.PORT || 8080;

const express = require('express');
const app = express();

// Add this line to handle JSON payloads
app.use(express.json());

process.env.GOOGLE_APPLICATION_CREDENTIALS = "E:/MscDataDissertation2324/MscDataDissertation/frontend/Site/polar-ensign-432610-t7-174ee999abd2.json";


// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/player/:player_id', async (req, res) => {
    const playerId = parseInt(req.params.player_id, 10);

    try {
        // Fetch player info from the transfermarkt.players table
        const playerQuery = `
            SELECT *
            FROM \`polar-ensign-432610-t7.transfermarkt.players\`
            WHERE player_id = @playerId
            LIMIT 1
        `;
        const [playerJob] = await bigquery.createQueryJob({
            query: playerQuery,
            params: { playerId: playerId },
        });
        const [playerRows] = await playerJob.getQueryResults();

        if (playerRows.length === 0) {
            return res.status(404).send('Player not found');
        }

        const playerData = playerRows[0];

        // Fetch player stats from the squadsight_scouting.2023-2024 table
        const statsQuery = `
            SELECT *
            FROM \`polar-ensign-432610-t7.squadsight_scouting.2023-2024\`
            WHERE Player = @playerName
        `;
        const [statsJob] = await bigquery.createQueryJob({
            query: statsQuery,
            params: { playerName: playerData.name }, // Assuming the name is used for lookup
        });
        const [statsRows] = await statsJob.getQueryResults();

        // Attach stats to the player data
        playerData.stats = statsRows.length > 0 ? statsRows[0] : null;

        res.json(playerData);
    } catch (error) {
        console.error('Error fetching player data:', error);
        res.status(500).send('Error fetching player data');
    }
});


app.get('/api/club/:club_id/players', async (req, res) => {
    const clubId = parseInt(req.params.club_id, 10);
    const currentYear = 2023;

    const query = `
        SELECT 
            player_id, name, position, sub_position, date_of_birth, 
            height_in_cm, foot, contract_expiration_date, image_url
        FROM 
            \`polar-ensign-432610-t7.transfermarkt.players\`
        WHERE 
            current_club_id = @clubId
            AND last_season >= @currentYear
        ORDER BY 
            position, name;
    `;

    const options = {
        query: query,
        location: 'EU',
        params: { clubId: clubId ,
            currentYear: currentYear},
    };

    try {
        const [job] = await bigquery.createQueryJob(options);
        const [rows] = await job.getQueryResults();
        res.json(rows);
    } catch (error) {
        console.error('Error querying BigQuery:', error);
        res.status(500).send('Error fetching players');
    }
});

app.post('/api/scouting', async (req, res) => {
    const { league, minAge, maxAge, conditions } = req.body;
    let query = `
        SELECT Player, League, Ast, \`Tackles - Tkl\`, \`SCA - SCA\`, \`GCA - GCA\`, xAG
        FROM \`polar-ensign-432610-t7.squadsight_scouting.2023-2024\`
        WHERE 1=1
    `;

    const queryParams = {};

    console.log('Received scouting criteria:', req.body); // Log the incoming request

    // Add league filter
    if (league) {
        query += ` AND League = @league`;
        queryParams['league'] = league;
    }

    // Add age range filter
    if (minAge) {
        query += ` AND age >= @minAge`;
        queryParams['minAge'] = parseInt(minAge, 10); // Ensure minAge is treated as an integer
    }
    if (maxAge) {
        query += ` AND age <= @maxAge`;
        queryParams['maxAge'] = parseInt(maxAge, 10); // Ensure maxAge is treated as an integer
    }

    // Apply conditions dynamically
    if (conditions && conditions.length > 0) {
        conditions.forEach((condition, index) => {
            const { column, operator, value } = condition;
            query += ` AND \`${column}\` ${operator} @value${index}`;
            queryParams[`value${index}`] = value;
        });
    }

    console.log('Generated BigQuery SQL:', query); // Log the generated query
    console.log('Query parameters:', queryParams); // Log the query parameters

    try {
        const [job] = await bigquery.createQueryJob({
            query,
            params: queryParams,
        });
        const [rows] = await job.getQueryResults();

        console.log('BigQuery result rows:', rows); // Log the result rows

        // For each player, fetch their player_id from the transfermarkt.players table
        for (let player of rows) {
            const playerQuery = `
                SELECT player_id
                FROM \`polar-ensign-432610-t7.transfermarkt.players\`
                WHERE name = @playerName
                LIMIT 1
            `;
            const [playerJob] = await bigquery.createQueryJob({
                query: playerQuery,
                params: { playerName: player.Player },
            });
            const [playerResults] = await playerJob.getQueryResults();

            console.log(`Player ID for ${player.Player}:`, playerResults); // Log player ID result

            // If the player is found, attach the player_id to the player data
            if (playerResults.length > 0) {
                player.player_id = playerResults[0].player_id;
            } else {
                player.player_id = null; // Handle case where player_id is not found
            }
        }

        res.json(rows);
    } catch (error) {
        console.error('Error querying BigQuery:', error);
        res.status(500).send('Error fetching scouting data');
    }
});




app.get('/api/leagues', async (req, res) => {
    const query = `
        SELECT DISTINCT League 
        FROM \`polar-ensign-432610-t7.squadsight_scouting.2023-2024\`
        ORDER BY League
    `;
    
    try {
        const [job] = await bigquery.createQueryJob({ query });
        const [rows] = await job.getQueryResults();
        const leagues = rows.map(row => row.League);
        res.json(leagues);
    } catch (error) {
        console.error('Error fetching leagues:', error);
        res.status(500).send('Error fetching leagues');
    }
});

app.get('/api/metrics', async (req, res) => {
    try {
        const query = `
            SELECT column_name 
            FROM \`polar-ensign-432610-t7.squadsight_scouting.INFORMATION_SCHEMA.COLUMNS\`
            WHERE table_name = '2023-2024'
        `;

        const [job] = await bigquery.createQueryJob({ query });
        const [rows] = await job.getQueryResults();

        // Extract column names
        const metrics = rows.map(row => row.column_name);
        res.json(metrics);
    } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).send('Error fetching metrics');
    }
});


app.get('/api/matches', async (req, res) => {
    const date = req.query.date;
    console.error('attemping to fetch matches');
    if (!date) {
        console.error('Date parameter is missing');
        return res.status(400).json({ error: 'Date is required' });
    }

    try {
        console.log(`Fetching matches for date: ${date}`);

        const query = `
            SELECT 
                competition_type, 
                home_club_name, 
                away_club_name, 
                home_club_goals, 
                away_club_goals, 
                date, 
                stadium, 
                round, 
                url
            FROM \`polar-ensign-432610-t7.transfermarkt.games\`
            WHERE date = @date
        `;

        const options = {
            query: query,
            location: 'EU',  // Adjust based on your BigQuery dataset location
            params: { date: date }
        };

        // Run the query and fetch results
        const [rows] = await bigquery.query(options);

        if (rows.length === 0) {
            console.log(`No matches found for date: ${date}`);
        } else {
            console.log(`Matches found: ${rows.length}`);
        }

        // Return the fetched data as JSON
        res.json({ matches: rows });
    } catch (error) {
        console.error('Error fetching matches from BigQuery:', error);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

// Route to serve index.html when accessing root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
