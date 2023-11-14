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
        if (rows.rows)
        {
            return rows.rows;
        }
        return rows;
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
            SELECT
                R.routine_name,
                R.routine_id,
                (
                    SELECT TO_CHAR(J.completion_date :: DATE, 'Mon dd, ''yy')
                    FROM journal J
                    WHERE J.routine_id = R.routine_id
                        AND J.movement_id IS NULL
                    ORDER BY J.completion_date DESC LIMIT 1
                ) AS last_logged
            FROM routines R 
            ORDER BY routine_order;
        `);
    },
    getRoutineById: async (routineId) => {
        return await runQuery(`
            SELECT
                R.routine_name,
                R.routine_id,
                (
                    SELECT TO_CHAR(J.completion_date :: DATE, 'Mon dd, ''yy')
                    FROM journal J
                    WHERE J.routine_id = R.routine_id
                        AND J.movement_id IS NULL
                    ORDER BY J.completion_date DESC LIMIT 1
                ) AS last_logged
            FROM routines R 
            WHERE routine_id=${routineId}
            ORDER BY routine_order;
        `);
    },
    markRoutineComplete: async (routineId) => {
        return await runQuery(`
            INSERT INTO journal (routine_id)
            VALUES (${routineId})
            RETURNING routine_id
        `);
    },
    unmarkRoutineComplete: async (routineId) => {
        return await runQuery(`
            WITH first_match AS (
                SELECT *
                FROM journal
                WHERE routine_id=${routineId}
                AND movement_id IS NULL
                ORDER BY completion_date DESC LIMIT 1
            )
            DELETE FROM journal
            WHERE entry_id = (SELECT entry_id FROM first_match)
            RETURNING *;
        `)
    },
    getUpNextRoutine: async () => {
        return await runQuery(`
            SELECT
                R.routine_name,
                R.routine_id,
                (
                    SELECT J.completion_date
                    FROM journal J
                    WHERE J.routine_id = R.routine_id
                        AND J.movement_id IS NULL
                    ORDER BY J.completion_date DESC LIMIT 1
                ) AS last_logged
            FROM routines R
            ORDER BY last_logged LIMIT 1;
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
            SELECT *, TO_CHAR(completion_date :: DATE, 'Mon dd, ''yy')
            FROM journal
            WHERE routine_id=${routineId}
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
            SELECT
                M.movement_name,
                M.movement_id,
                M.weight,
                M.num_sets,
                M.num_reps,
                M.set_id,
                M.instruction,
                (
                    SELECT TO_CHAR(J.completion_date  :: DATE, 'Mon dd, ''yy')
                    FROM journal J
                    WHERE J.movement_id = M.movement_id
                    ORDER BY J.completion_date DESC LIMIT 1
                ) as last_logged
            FROM movements M
            WHERE routine_id=${routineId}
            ORDER BY M.set_id, M.movement_id
        `);
        // return await runQuery(`
        //     SELECT *, TO_CHAR(last_completed :: DATE, 'Mon dd, ''yy')
        //     FROM movements
        //     WHERE routine_id=${routineId}
        //     ORDER BY set_id, movement_id;
        // `);
    },
    addMovement: async (routineId, setId, movementName, movementWeight, movementSets, movementReps) => {
        const fixedName = SqlString.escape(movementName);
        const slug = fixedName.replace(/\s+/g, '').toLowerCase();
        return await runQuery(`
            INSERT INTO movements (routine_id, set_id, movement_name, movement_slug, weight, num_sets, num_reps)
            VALUES (${routineId}, ${setId}, ${fixedName}, ${slug}, ${movementWeight}, ${movementSets}, ${movementReps})
            RETURNING *;`);
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
    addMovementJournalEntry: async (movementId, routineId, weight, sets, reps, instruction) => {
        await runQuery(`
            UPDATE movements
            SET weight=${weight}, num_sets=${sets}, num_reps=${reps}, last_completed=CURRENT_DATE, instruction=${instruction}
            WHERE movement_id=${movementId};`);
        return await runQuery(`
            INSERT INTO journal (movement_id, routine_id, weight, sets, reps, type, instruction)
            VALUES (${movementId}, ${routineId}, ${weight}, ${sets}, ${reps}, 'entry', ${instruction})
            RETURNING movement_id, routine_id, weight, sets, reps;
        `);
    },
    addMovementJournalNote: async (movementId, routineId, note) => {
        const fixedNote = SqlString.escape(note);
        return await runQuery(`
            INSERT INTO journal (movement_id, routine_id, note, type)
            VALUES (${movementId}, ${routineId}, ${fixedNote}, 'note')
            RETURNING movement_id;
        `);
    },
    getRoutineCalendar: async () => {
        return await runQuery(`
            SELECT
                J.routine_id,
                J.completion_date,
                (
                    SELECT TO_CHAR(J.completion_date :: DATE, 'fmMM fmdd, yyyy')
                    FROM journal
                    WHERE routine_id = J.routine_id 
                        AND completion_date = J.completion_date 
                        AND movement_id IS NULL
                    ORDER BY completion_date desc
                    LIMIT 1
                ) as pretty_date,
                (
                    SELECT routine_name
                    FROM routines
                    WHERE routine_id = J.routine_id
                ) as routine_name
            FROM journal J
            WHERE movement_id IS NULL
            ORDER BY completion_date desc
            LIMIT 31
        `);
    }
};