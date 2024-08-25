const { BigQuery } = require('@google-cloud/bigquery');
const bigquery = new BigQuery();

async function testBigQuery() {
    const query = `
        SELECT * 
        FROM \`polar-ensign-432610-t7.transfermarkt.players\`
        LIMIT 1
    `;
    
    try {
        const [job] = await bigquery.createQueryJob({ query });
        const [rows] = await job.getQueryResults();
        console.log('Query results:', rows);
    } catch (error) {
        console.error('ERROR:', error);
    }
}

testBigQuery();
