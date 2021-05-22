const express = require('express');
const path = require('path');
const cons = require('consolidate');
const postgres = require('./pg.js');
const ejs = require('ejs');
const { getRoutines, addRoutine, getUpNextRoutine, getNumSets, getRoutineMovements, getRoutineById } = require('./pg.js');
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

app.get('/:routine', async (req, res) => {
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
  console.log(numSets[0].count);
  let movements = await getRoutineMovements(thisRoutine[0].routine_id);
  
  return {
    routines: routines,
    nextRoutine: nextRoutine[0],
    thisRoutine: thisRoutine[0],
    movements: movements,
    numSets: numSets[0].count
  }
}

app.post('/addroutine/:routineName/:routineOrder', async(req, res) => {
  console.log(`Adding ${req.params.routineName} to routines`);
  addRoutine(req.params.routineName, req.params.routineOrder);
});

var server = app.listen(app.get('port'), function() {
  app.address = app.get('host') + ':' + server.address().port;
  console.log('Listening at ' + app.address);
});
