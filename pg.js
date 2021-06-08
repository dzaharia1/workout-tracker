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
    getTodaysDate: async () => {
        let date = await runQuery(`
            SELECT CURRENT_DATE, TO_CHAR(CURRENT_DATE :: DATE, 'Mon dd, ''yy');
        `);
        return date[0].to_char;
    },
    getRoutines: async () => {
        return await runQuery(`
            SELECT *, TO_CHAR(last_logged :: DATE, 'Mon dd, ''yy') FROM routines
            ORDER BY routine_order;
        `);
    },
    getRoutineById: async (routineId) => {
        return await runQuery(`
            SELECT *, TO_CHAR(last_logged :: DATE, 'Mon dd, ''yy') FROM routines
            WHERE routine_id=${routineId};
        `);
    },
    markRoutineComplete: async (routineId) => {
        await runQuery(`
            INSERT INTO journal (routine_id)
            VALUES (${routineId})
            RETURNING routine_id;`);
        return await runQuery(`UPDATE routines
            SET last_logged=CURRENT_DATE
            WHERE routine_id=${routineId};`);
    },
    unmarkRoutineComplete: async (routineId) => {
        await runQuery(`
            DELETE FROM journal WHERE routine_id=${routineId};
        `);
        let previousDate = await runQuery(`
            SELECT completion_date FROM journal
            WHERE routine_id=${routineId};
        `);
        return await runQuery(`
            UPDATE routines
            SET last_logged=${previousDate}
            WHERE routine_id=${routineId}`);
    },
    getUpNextRoutine: async () => {
        return await runQuery(`
            SELECT * FROM ROUTINES
            ORDER BY last_logged
            FETCH FIRST 1 rows ONLY;
        `);
    },
    addRoutine: async (routineName, routineOrder) => {
        const fixedOrder = parseInt(routineOrder, 10);
        const fixedName = SqlString.escape(routineName);
        const slug = fixedName.replace(/\s+/g, '').toLowerCase();
        return await runQuery(`
            INSERT INTO routines (routine_name, routine_slug, routine_order)
            VALUES (${fixedName}, ${slug}, ${fixedOrder})
            RETURNING routine_id;
        `);
    },
    changeRoutineOrder: async (categorySlug, order) => {
        // todo
    },
    getRoutineJournal: async (routineId) => {
        return await runQuery(`
            SELECT * FROM journal WHERE routine_id=${routineId}
        `);
    },
    getNumSets: async (routineId) => {
        return await runQuery(`
            SELECT COUNT(DISTINCT set_id)
            FROM movements
            WHERE routine_id=${routineId};
        `);
    },
    getAllMovements: async () => {
        return await runQuery(`
            SELECT * FROM movements
            ORDER BY set_id, movement_id;
        `);
    },
    getRoutineMovements: async (routineId) => {
        return await runQuery(`
            SELECT *, TO_CHAR(last_completed :: DATE, 'Mon dd, ''yy')
            FROM movements
            WHERE routine_id=${routineId}
            ORDER BY set_id, movement_id;
        `);
    },
    addMovement: async (routineId, setId, movementName, movementWeight, movementSets, movementReps) => {
        const fixedName = SqlString.escape(movementName);
        const slug = fixedName.replace(/\s+/g, '').toLowerCase();
        return await runQuery(`
            INSERT INTO movements (routine_id, set_id, movement_name, movement_slug, weight, num_sets, num_reps)
            VALUES (${routineId}, ${setId}, ${fixedName}, ${slug}, ${movementWeight}, ${movementSets}, ${movementReps})
            RETURNING movement_id;`);
    },
    updateMovementNumbers: async (movementId, weight, sets, reps) => {
        return await runQuery(`
            UPDATE movements
            SET weight=${weight}, num_sets=${sets}, num_reps=${reps}
            WHERE movement_id=${movementId};`);
    },
    editMovement: async (movementId, movementName, setId) => {
        let movement = await runQuery(`
            SELECT routine_id, set_id FROM movements
            WHERE movement_id=${movementId};
        `);
        let originalSet = movement[0].set_id;
        let routineId = movement[0].routine_id;
        
        let setSize = await runQuery(`
            SELECT * FROM movements
            WHERE routine_id=${routineId} AND set_id=${originalSet};
        `);
        setSize = setSize.length;
        
        let ret = await runQuery(`
            UPDATE movements
            SET set_id=${setId}, movement_name='${movementName}'
            WHERE movement_id=${movementId};
        `);

        if (setSize < 1) {
            await runQuery(`
                UPDATE movements
                SET set_id=set_id-1
                WHERE set_id > ${originalSet};
            `);
        }

        return ret;
    },
    deleteMovement: async (movementId, routineId) => {
        let setId = await runQuery(`
            SELECT set_id FROM movements WHERE movement_id=${movementId}
        `);
        setId = setId[0].set_id;
        let setSize = await runQuery(`
            SELECT * FROM movements
            WHERE routine_id=${routineId} AND set_id=${setId};
        `);
        setSize = setSize.length;

        if (setSize <= 1) {
            await runQuery(`
                UPDATE movements
                SET set_id=set_id - 1
                WHERE set_id > ${setId};
            `);
        }

        await runQuery(`
            DELETE FROM journal
            WHERE movement_id=${movementId};
        `);
        return await runQuery(`
            DELETE FROM movements
            WHERE movement_id=${movementId};
        `);
    },
    getMovementJournal: async (movementId) => {
        return await runQuery(`
            SELECT *, TO_CHAR(completion_date :: DATE, 'Mon dd, ''yy')
            FROM journal
            WHERE movement_id=${movementId}
            ORDER BY completion_date DESC, entry_id DESC;
        `);
    },
    addMovementJournalEntry: async (movementId, routineId, weight, sets, reps) => {
        await runQuery(`
            UPDATE movements
            SET weight=${weight}, num_sets=${sets}, num_reps=${reps}, last_completed=CURRENT_DATE
            WHERE movement_id=${movementId};`);
        return await runQuery(`
            INSERT INTO journal (movement_id, routine_id, weight, sets, reps, type)
            VALUES (${movementId}, ${routineId}, ${weight}, ${sets}, ${reps}, 'entry');
        `);
    },
    addMovementJournalNote: async (movementId, routineId, note) => {
        const fixedNote = SqlString.escape(note);
        return await runQuery(`
            INSERT INTO journal (movement_id, routine_id, note, type)
            VALUES (${movementId}, ${routineId}, ${fixedNote}, 'note')
            RETURNING movement_id;
        `);
    }
};