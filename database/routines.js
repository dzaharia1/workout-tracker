const pg = require('./pg.js');

let runQuery = async query => {
    return pg.runQuery(query);
};

module.exports = {
    getRoutines: async () => {
        return await runQuery(`
            SELECT *, TO_CHAR(last_logged :: DATE, 'Mon dd, ''yy')
            FROM routines
            ORDER BY routine_order;
        `);
    },
    getRoutineById: async (routineId) => {
        return await runQuery(`
            SELECT *, TO_CHAR(last_logged :: DATE, 'Mon dd, ''yy')
            FROM routines
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
    }
};