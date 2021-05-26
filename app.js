const express = require('express');
const path = require('path');
const cons = require('consolidate');
const postgres = require('./pg.js');
const fs = require('fs');
const https = require('https');
const { getRoutines, addRoutine, getUpNextRoutine, getNumSets, getRoutineMovements, getRoutineById, addMovement, getMovementJournal, addMovementJournalEntry } = require('./pg.js');
const app = express();

const localport = '3333';
const localhost = 'https://localhost';

app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.engine('ejs', cons.ejs);
app.set('view engine', 'ejs');


app.host = app.set('host', process.env.HOST || localhost);
app.port = app.set('port', process.env.PORT || localport);

app.get('/', async (req, res) => {
  res.render('index', await assemblePageData());
});

app.get('/routine/:routine', async (req, res) => {
  res.render('index', await assemblePageData(req.params.routine));
});

async function assemblePageData (routineId) {
  let routines = await getRoutines();
  let nextRoutine = await getUpNextRoutine();
  let thisRoutine;
  if (routineId) {
    thisRoutine = await getRoutineById(routineId);
  } else {
    thisRoutine = nextRoutine;
  }
  let numSets = await getNumSets(thisRoutine[0].routine_id);
  let movements = await getRoutineMovements(thisRoutine[0].routine_id);
  
  return {
    routines: routines,
    nextRoutine: nextRoutine[0],
    thisRoutine: thisRoutine[0],
    movements: movements,
    numSets: numSets[0].count
  }
}

app.post('/addroutine/:routineName/:routineOrder', async (req, res) => {
  console.log(`Adding ${req.params.routineName} to routines`);
  addRoutine(
    req.params.routineName,
    req.params.routineOrder
  );
});

app.post('/addmovement/:routineid/:setid/:movementName/:weight/:sets/:reps', async (req, res) => {
  console.log(`Adding ${req.params.movementName} to ${req.params.routineid} in ${req.params.setid}`);
  addMovement(
    req.params.routineid,
    req.params.setid,
    req.params.movementName,
    req.params.weight,
    req.params.sets,
    req.params.reps
  );
});

app.post('/journal/addmovement/:movementid/:weight/:sets/:reps', async (req, res) => {
  addMovementJournalEntry(
    req.params.movementid,
    req.params.weight,
    req.params.sets,
    req.params.reps
  )
});

app.get('/journal/getmovement/:movementid', async (req, res) => {
  let movementId = req.params.movementid
  let journal = await getMovementJournal(movementId);
  res.json(journal);
});

if (process.env.ENVIRONMENT === 'PROD' || process.env.ENVIRONMENT === 'LOCAL') {
  https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
  }, app)
  .listen(app.get('port'), function () {
    app.address = `${app.get('host')}:${app.get('port')}`;
    console.log(`Listening at ${app.address}`);
  })
} else {
  var server = app.listen(app.get('port'), function() {
    app.address = app.get('host') + ':' + app.get('port');
    console.log('Listening at ' + app.address);
  });
}
