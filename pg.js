const SqlString = require('sqlstring');
const { Pool, Client } = require('pg');

let client;

if (process.env.DATABASE_URL) {
    client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
} else {
    client = new Client({
        connectionString: `postgresql://dan@localhost:5432/workouts`
    });
}
client.connect();

async function runQuery(query) {
    let rows;

    try {
        rows = await client.query(query);
    } catch (error) {
        console.error('~~~~~~~~~~~~~~there was an error~~~~~~~~~~~~~~~~');
        console.error(error.stack);
    } finally {
        return rows.rows;
    }
}

module.exports = {
    getRoutines: async () => {
        return await runQuery(`SELECT *, TO_CHAR(last_logged :: DATE, 'Mon dd, ''yy') FROM routines ORDER BY routine_order;`);
    },
    getRoutineById: async (routineId) => {
        return await runQuery(`SELECT * FROM routines WHERE routine_id=${routineId};`);
    },
    getUpNextRoutine: async () => {
        return await runQuery(`SELECT * FROM ROUTINES
        ORDER BY last_logged
        FETCH FIRST 1 rows ONLY;`);
    },
    addRoutine: async (routineName, routineOrder) => {
        const fixedOrder = parseInt(routineOrder, 10);
        const fixedName = SqlString.escape(routineName);
        const slug = fixedName.replace(/\s+/g, '').toLowerCase();
        return await runQuery(`INSERT INTO routines (routine_name, routine_slug, routine_order)
        VALUES (${fixedName}, ${slug}, ${fixedOrder})
        RETURNING routine_id;`);
    },
    changeRoutineOrder: async (categorySlug, order) => {
        // todo
    },
    getNumSets: async (routineId) => {
        return await runQuery(`SELECT COUNT(DISTINCT set_id) FROM movements WHERE routine_id=${routineId};`);
    },
    getAllMovements: async () => {
        return await runQuery('SELECT * FROM movements');
    },
    getRoutineMovements: async (routineId) => {
        return await runQuery(`SELECT * FROM movements WHERE routine_id=${routineId};`);
    }
};