const express = require('express');
const path = require('path');
const cons = require('consolidate');
const postgres = require('./pg.js');
const ejs = require('ejs');
const cors = require('cors');
const { getRoutines, addRoutine, getUpNextRoutine, getNumSets, getRoutineMovements, getRoutineJournal, getRoutineById, addMovement, getMovementJournal, addMovementJournalEntry, getTodaysDate, markRoutineComplete, editMovement, deleteMovement, getAllMovements, addMovementJournalNote, unmarkRoutineComplete } = require('./pg.js');
const app = express();

const localport = '3333';
const localhost = 'http://localhost';

app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.engine('ejs', cons.ejs);
app.set('view engine', 'ejs');


app.host = app.set('host', process.env.HOST || localhost);
app.port = app.set('port', process.env.PORT || localport);

app.get('/', async (req, res) => {
  res.render('index', await assemblePageData());
});

// app.get('/routine/:routine', async (req, res) => {
//   res.render('index', await assemblePageData(req.params.routine));
// });

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
  res.json(addRoutine(
    req.params.routineName,
    req.params.routineOrder
  ));
});

app.post('/routine/markComplete/:routineId', async (req, res) => {
  console.log(`marking routine ${req.params.routineId} complete`);
  let response = await markRoutineComplete(req.params.routineId);
  res.json(response);
});

app.post('/routine/unmarkcomplete/:routineId', async (req, res) => {
  console.log(`unmarking routine ${req.params.routineId} complete`);
  let response = await unmarkRoutineComplete(req.params.routineId);
  res.json(response);
});

app.post('/movement/add/:routineid/:setid/:movementName/:weight/:sets/:reps', async (req, res) => {
  console.log(`Got: ${req.params.movementName}`)
  res.json(await addMovement(
    req.params.routineid,
    req.params.setid,
    req.params.movementName,
    req.params.weight,
    req.params.sets,
    req.params.reps
  ));
});

app.put('/movement/edit/:movementid/:movementname/:setid', async (req, res) => {
  res.json(editMovement(
    req.params.movementid,
    req.params.movementname,
    req.params.setid
  ));
});

app.get('/routine/current', async (req, res) => {
  const ret = await assemblePageData();
  res.json(ret);
});

app.get('/routine/:routineid', async (req, res) => {
  const ret = await assemblePageData(req.params.routineid);
  res.json(ret);
});
 
app.get('/movements/:routineid', async (req, res) => {
  const ret = await getRoutineMovements(req.params.routineid);
  res.json(ret);
});

app.get('/routines', async (req, res) => {
  const ret = await getRoutines();
  res.json(ret);
});

app.post('/journal/addmovement/:routineid/:movementid/:weight/:sets/:reps/:instruction', async (req, res) => {
  console.log(req.params);
  const ret = await addMovementJournalEntry(
    req.params.routineid,
    req.params.movementid,
    req.params.weight,
    req.params.sets,
    req.params.reps,
    req.params.instruction
  );

  res.json(ret);
});

app.post(`/journal/addmovementnote/:routineid/:movementid/:note`, async (req, res) => {
  res.json(addMovementJournalNote(
    req.params.movementid,
    req.params.routineid,
    req.params.note
  ));
});

app.delete('/movement/delete/:movementid/:routineid', async (req, res) => {
  res.json(deleteMovement(
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
  res.json(journal);
});

var server = app.listen(app.get('port'), function() {
  app.address = app.get('host') + ':' + server.address().port;
  console.log('Listening at ' + app.address);
});
