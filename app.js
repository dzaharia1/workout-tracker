const express = require('express');
const path = require('path');
const cons = require('consolidate');
const postgres = require('./pg.js');
const ejs = require('ejs');
const { getRoutines, addRoutine, getUpNextRoutine, getNumSets, getRoutineMovements, getRoutineById, addMovement, getMovementJournal, addMovementJournalEntry, getTodaysDate, markRoutineComplete, editMovement, deleteMovement } = require('./pg.js');
const app = express();

const localport = '3333';
const localhost = 'http://localhost';

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
  let todaysDate = await getTodaysDate();
  
  return {
    routines: routines,
    nextRoutine: nextRoutine[0],
    thisRoutine: thisRoutine[0],
    movements: movements,
    numSets: numSets[0].count,
    todaysDate: todaysDate
  }
}

app.post('/routine/add/:routineName/:routineOrder', async (req, res) => {
  console.log(`Adding ${req.params.routineName} to routines`);
  addRoutine(
    req.params.routineName,
    req.params.routineOrder
  );
});

app.put('/routine/markComplete/:routineId', async (req, res) => {
  console.log(`marking routine ${req.params.routineId} complete`);
  markRoutineComplete(req.params.routineId);
});

app.post('/movement/add/:routineid/:setid/:movementName/:weight/:sets/:reps', async (req, res) => {
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

app.put('/movement/edit/:movementid/:movementname/:setid', async (req, res) => {
  editMovement(
    req.params.movementid,
    req.params.movementname,
    req.params.setid
  )
});

app.post('/journal/addmovement/:routineid/:movementid/:weight/:sets/:reps', async (req, res) => {
  addMovementJournalEntry(
    req.params.routineid,
    req.params.movementid,
    req.params.weight,
    req.params.sets,
    req.params.reps
  );
});

app.delete('/movement/delete/:movementid/:routineid', async (req, res) => {
  res.send(deleteMovement(
    req.params.movementid,
    req.params.routineid
  ));
});

app.get('/journal/movement/:movementid', async (req, res) => {
  let movementId = req.params.movementid
  let journal = await getMovementJournal(movementId);
  res.json(journal);
});

app.get('/journal/routine/:routineid', async (req, res) => {
  let journal = await getRoutineJournal(req.params.routineid);
});

var server = app.listen(app.get('port'), function() {
  app.address = app.get('host') + ':' + server.address().port;
  console.log('Listening at ' + app.address);
});
