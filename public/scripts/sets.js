let addMovementButtons = document.querySelectorAll('.movement__add-new');
let saveMovementButton = document.querySelector('.movement__save-button');
const addMovementOverlay = document.querySelector('.overlay--add-movement');
const addSetButton = document.querySelector('.set__add-new');
const routineId = document.querySelector('.header').getAttribute('data-routineid');
const movementJournal = document.querySelector('.movement-journal');
const movementJournalButtons = document.querySelectorAll('.movement__journal-button');
const movementJournalOverlay = document.querySelector('.overlay--movement-journal');
const movementJournalAddEntryButton = document.querySelector('.movement-journal__add-new');
const movementJournalSaveEntrybutton = document.querySelector('.movement-journal__entry-form .text-button');

function setsFunctionality() {
    for (let thisButton of addMovementButtons) {
        thisButton.addEventListener('click', (e) => {
            addMovementOverlay.classList.add('overlay--visible');
            document.querySelector('.movement--add-form').setAttribute('set-number', thisButton.parentNode.getAttribute('data-setid'));
        });
    }

    saveMovementButton.addEventListener('click', () => {
        console.log('adding movement');
        let form = document.querySelector('.movement--add-form');
        saveMovement(form, form.getAttribute('set-number'));
        addMovementOverlay.classList.remove('overlay--visible');
    });

    addSetButton.addEventListener('click', () => {
        document.querySelector('.set__list').insertBefore(createSetNode(), addSetButton.parentNode);
    });

    for (let thisButton of movementJournalButtons) {
        thisButton.addEventListener('click', () => {
            populateMovementJournal(thisButton.getAttribute('data-movementid'), thisButton.getAttribute('data-movementname'));
            movementJournalOverlay.classList.add('overlay--visible');
        });
    }

    movementJournalAddEntryButton.addEventListener('click', () => {
        document.querySelector('.movement-journal__entry-form').classList.add('movement-journal__entry-form--visible');
    });

    movementJournalSaveEntrybutton.addEventListener('click', () => {
        const form = movementJournalSaveEntrybutton.parentNode;
        const movementId = movementJournal.getAttribute('data-movementid');

        console.log(movementId);
        const name = form.querySelector('.movement-journal__name').innerText;
        const weight = form.querySelector('input[name="weight"]').value;
        const sets = form.querySelector('input[name="sets"]').value;
        const reps = form.querySelector('input[name="reps"]').value;
        const date = (new Date()).toLocaleDateString('en-US');

        movementJournal.prepend(createMovementJournalEntryNode(name, date, weight, sets, reps));
        APIRequest('POST', 'journal/addmovement', movementId, weight, sets, reps);

        form.classList.remove('movement-journal__entry-form--visible');
    });
}

function saveMovement(form, setId) {
    let routineId = document.querySelector('.header').getAttribute('data-routineid');
    let movementName = form.querySelector('.movement__name-field').value;
    let movementWeight = form.querySelector('input[name="weight"]').value;
    let movementSets = form.querySelector('input[name="sets"]').value;
    let movementReps = form.querySelector('input[name="reps"]').value;
    let newNode = createMovementNode(movementName, movementWeight, movementSets, movementReps);
    form.parentNode.insertBefore(newNode, form);
    form.classList.remove('movement--add-form--visible');
    APIRequest('POST', 'addmovement', routineId, setId, movementName, movementWeight, movementSets, movementReps);

    document.querySelector(`.set[data-setid="${setId}"] .movement__list`).appendChild(
        createMovementNode(
            movementName,
            movementWeight,
            movementSets,
            movementReps
        )
    );

    for (let thisField of form.querySelectorAll('input')) {
        thisField.value = '';
    }
}

function createMovementNode(name, weight, sets, reps) {
    let container = document.createElement('div');
    container.classList.add('movement');

    container.innerHTML = `
        <div class="movement__header">
            <h3 class="movement__name">${name}</h3>
            <button class="movement__edit-button"></button>
            <button class="movement__journal-button"></button>
        </div>
        <p class="movement__thing">Last:</p>
        <div class="movement__properties">
            <div class="movement__property">
                <h4>lbs</h4>
                <p>${weight}</p>
            </div>
            <div class="movement__property-divider"></div>
            <div class="movement__property">
                <h4>sets</h4>
                <p>${sets}</p>
            </div>
            <div class="movement__property-divider"></div>
            <div class="movement__property">
                <h4>reps</h4>
                <p>${reps}</p>
            </div>
        </div>`;

        return container;
}

function createSetNode() {
    let setNumber = document.querySelectorAll('.set').length;

    let set = document.createElement('li');
    set.classList.add('set');
    set.setAttribute('data-setid', setNumber);

    set.innerHTML = `
        <h1 class="set__title">Superset ${setNumber}</h1>
        <button class="movement__add-new">
            <img src="/img/add.svg" alt="">
            Add movement
        </button>
        <ul class="movement__list">
        </ul>
    `;

    set.querySelector('.movement__add-new').addEventListener('click', () => {
        addMovementOverlay.classList.add('overlay--visible');
        document.querySelector('.movement--add-form').setAttribute('set-number', set.querySelector('.movement__add-new').parentNode.getAttribute('data-setid'));
    });

    return set;
}

function createMovementJournalEntryNode (movementName, completionDate, movementWeight, movementSets, movementReps) {
    let entry = document.createElement('li');
    entry.classList.add('movement-journal__entry');
    entry.innerHTML = `
            <div>
                <p class="movement-journal__date">${completionDate}</p>
                <h3 class="movement-journal__name">${movementName}</h3>
            </div>
            <div class="movement-journal__property">
                <h4>lbs</h4>
                <p>${movementWeight}</p>
            </div>
            <div class="movement-journal__property">
                <h4>sets</h4>
                <p>${movementSets}</p>
            </div>
            <div class="movement-journal__property">
                <h4>reps</h4>
                <p>${movementReps}</p>
            </div>
       `

    return entry;
}

function populateMovementJournal (movementId, movementName) {
    let overlay = movementJournal.parentNode;

    movementJournal.setAttribute('data-movementid', movementId);
    movementJournal.innerHTML = '';
    overlay.querySelector('.movement-journal__entry-form .movement-journal__name').innerText = movementName;
    overlay.querySelector('.overlay__header h2').innerText = `${movementName} - journal`;

    APIRequest('GET', 'journal/getmovement', movementId).then(movementLog => {
        for (let logItem of movementLog) {
            movementJournal.appendChild(createMovementJournalEntryNode(
                movementName,
                logItem.to_char,
                logItem.weight,
                logItem.sets,
                logItem.reps
            ));
        }

    });
}

readyFunctions.push(setsFunctionality);