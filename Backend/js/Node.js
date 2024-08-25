const express = require('express');
const {BigQuery} = require('@google-cloud/bigquery');
const app = express();
const bigquery = new BigQuery();

// Route to fetch player data by player_id
app.get('/api/player/:player_id', async (req, res) => {
    const playerId = req.params.player_id;
    
    const query = `
      SELECT * 
      FROM \`polar-ensign-432610-t7.transfermarkt.players\`
      WHERE player_id = @playerId
    `;
    
    const options = {
      query: query,
      location: 'US',
      params: {playerId: playerId},
    };

    try {
        const [job] = await bigquery.createQueryJob(options);
        const [rows] = await job.getQueryResults();
        
        if (rows.length > 0) {
            res.json(rows[0]); // Return the first row (player data)
        } else {
            res.status(404).send('Player not found');
        }
    } catch (error) {
        console.error('ERROR:', error);
        res.status(500).send('Error querying BigQuery');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});