
import { SportType } from '../src/modules/sports/types/sports.types.js'; // Adjust path if needed
import { SPORT_API_CONFIGS } from '../src/modules/sports/clients/api-sports.client.js';

// Simple fetch test
async function testSport(sport: string) {
    const config = SPORT_API_CONFIGS[sport];
    if (!config) {
        console.error(`Invalid sport: ${sport}`);
        return;
    }

    const apiKey = process.env.APIFOOTBALL_API_KEY || '535bba4c6e9b1630b1da51d5e4531651'; // Fallback to what was in the file
    console.log(`Testing ${sport} with API Key: ${apiKey.slice(0, 5)}...`);

    const url = `${config.baseUrl}/status`;

    try {
        const res = await fetch(url, {
            headers: {
                'x-apisports-key': apiKey
            }
        });
        const data = await res.json();
        console.log(`[${sport}] Status: ${res.status}`);
        console.log(`[${sport}] Response:`, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(`[${sport}] Failed:`, e);
    }
}

// Test a few problematic sports
const sportsToTest = ['basketball', 'nba', 'formula1', 'afl'];
await Promise.all(sportsToTest.map(testSport));
