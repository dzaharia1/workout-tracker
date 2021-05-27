let addMovementButtons = document.querySelectorAll('.movement__add-new');
let saveMovementButton = document.querySelector('.movement__save-button#add');
const addMovementOverlay = document.querySelector('.overlay--add-movement');
const editMovementOverlay = document.querySelector('.overlay--edit-movement');
const editMovementSaveButton = document.querySelector('.movement__save-button#edit');
const deleteMovementButton = document.querySelector('.movement__delete-button');
const movementEditButtons = document.querySelectorAll('.movement__edit-button');
const addSetButton = document.querySelector('.set__add-new');
const movementJournal = document.querySelector('.movement-journal');
const movementJournalButtons = document.querySelectorAll('.movement__journal-button');
const movementJournalOverlay = document.querySelector('.overlay--movement-journal');
const movementJournalAddEntryButton = document.querySelector('.movement-journal__add-new');
const movementJournalSaveEntrybutton = document.querySelector('.movement-journal__entry-form .text-button');

function setsFunctionality() {
    for (let thisButton of addMovementButtons) {
        thisButton.addEventListener('click', (e) => {
            closeAllOverlays();
            addMovementOverlay.classList.add('overlay--visible');
            let form = document.querySelector('.movement--add-form');
            let setid = thisButton.parentNode.parentNode.getAttribute('data-setid');
            form.setAttribute('data-setid', setid);
            form.parentNode.querySelector('h2').innerText = `Add a movement to superset ${setid}`;
            form.querySelector('.movement__name-field').focus();
        });
    }

    saveMovementButton.addEventListener('click', () => {
        console.log('adding movement');
        let form = document.querySelector('.movement--add-form');
        saveMovement(form, form.getAttribute('data-setid'));
        closeAllOverlays();
    });

    addSetButton.addEventListener('click', () => {
        document.querySelector('.set__list').insertBefore(createSetNode(), addSetButton.parentNode);
    });

    for (let thisButton of movementJournalButtons) {
        thisButton.addEventListener('click', () => {
            closeAllOverlays();
            populateMovementJournal(thisButton.getAttribute('data-movementid'), thisButton.getAttribute('data-movementname'));
            movementJournalOverlay.classList.add('overlay--visible');
        });
    }

    for (let thisButton of movementEditButtons) {
        thisButton.addEventListener('click', () => {
            const movementNode = thisButton.parentNode.parentNode;
            populateEditDialog(
                movementNode.getAttribute('data-movementid'),
                movementNode.parentNode.getAttribute('data-setid'),
                movementNode.querySelector('.movement__name').innerText,
                movementNode.querySelector('#weight').innerText,
                movementNode.querySelector('#sets'),
                movementNode.querySelector('#reps')
            )
            closeAllOverlays();
            editMovementOverlay.classList.add('overlay--visible');
        })
    }

    editMovementSaveButton.addEventListener('click', () => {
        editMovement(editMovementSaveButton.parentNode.parentNode);
        closeAllOverlays();
    });

    movementJournalAddEntryButton.addEventListener('click', () => {
        document.querySelector('.movement-journal__entry-form').classList.add('movement-journal__entry-form--visible');
        movementJournalAddEntryButton.style.display = 'none';
    });

    movementJournalSaveEntrybutton.addEventListener('click', () => {
        const form = movementJournalSaveEntrybutton.parentNode;
        const movementId = movementJournal.getAttribute('data-movementid');

        console.log(movementId);
        const name = form.querySelector('.movement-journal__name').innerText;
        const weight = form.querySelector('input[name="weight"]').value;
        const sets = form.querySelector('input[name="sets"]').value;
        const reps = form.querySelector('input[name="reps"]').value;
        const date = movementJournalSaveEntrybutton.getAttribute('data-date');

        movementJournal.prepend(createMovementJournalEntryNode(name, date, weight, sets, reps));
        APIRequest('POST', 'journal/addmovement', movementId, routineId, weight, sets, reps);
        form.classList.remove('movement-journal__entry-form--visible');
        movementJournalAddEntryButton.style.display = 'block';
    });

    deleteMovementButton.addEventListener('click', () => {
        const movementId = deleteMovementButton.getAttribute('data-movementid');
        const movementNode = document.querySelector(`.movement[data-movementid="${movementId}"]`);

        if (deleteMovementButton.getAttribute('data-mode') === 'confirm') {
            console.log('removming');
            movementNode.remove();
            deleteMovementButton.setAttribute('data-mode', 'default');
            deleteMovementButton.innerText = 'Delete';
            APIRequest('DELETE', 'movement/delete', movementId, routineId);
            closeAllOverlays();
        } else {
            console.log('confirming');
            const movementName = movementNode.querySelector('.movement__name').innerText;
            deleteMovementButton.setAttribute('data-mode', 'confirm');
            deleteMovementButton.innerText = `Delete ${movementName}?`;
        }

    });
}

function closeAllOverlays () {
    for (let thisOverlay of document.querySelectorAll('.overlay')) {
        thisOverlay.classList.remove('overlay--visible');
    }
}

function populateEditDialog (movementId, setId, movementName) {
    const overlayHeader = editMovementOverlay.querySelector('h2');
    const nameInput = editMovementOverlay.querySelector('.movement__name-field');
    const saveButton = editMovementOverlay.querySelector('.movement__save-button');
    const deleteButton = editMovementOverlay.querySelector('.movement__delete-button');
    const setSelector = editMovementOverlay.querySelector('.movement__set-field');

    for (let option of setSelector.querySelectorAll('option')) {
        if (option.value === setId) { option.setAttribute('selected', '') }
    }

    nameInput.value = movementName;
    overlayHeader.innerText = `Edit ${movementName}`;
    saveButton.setAttribute('data-movementid', movementId);
    deleteButton.setAttribute('data-movementid', movementId);
    deleteButton.setAttribute('mode', 'default');

}

function editMovement (form) {
    const movementName = form.querySelector('[name="name"').value;
    const setId = form.querySelector('[name=set]').value;
    const movementId = form.querySelector('.movement__save-button').getAttribute('data-movementid');
    const movementNode = document.querySelector(`.movement[data-movementid="${movementId}"]`);
    const currentSetId = movementNode.parentNode.getAttribute('data-setid');
    
    if (setId !== currentSetId) {
        const newSet = document.querySelector(`.movement__list[data-setid="${setId}"]`);
        newSet.appendChild(movementNode);
    }
    movementNode.querySelector('.movement__name').innerText = movementName;
    
    APIRequest('PUT', 'movement/edit', movementId, movementName, setId);
}

function saveMovement (form, setId) {
    console.log(`looking for set id ${setId}`);
    let routineId = document.querySelector('.header').getAttribute('data-routineid');
    let movementName = form.querySelector('.movement__name-field').value;
    let movementWeight = form.querySelector('input[name="weight"]').value;
    let movementSets = form.querySelector('input[name="sets"]').value;
    let movementReps = form.querySelector('input[name="reps"]').value;
    form.classList.remove('movement--add-form--visible');
    APIRequest('POST', 'movement/add', routineId, setId, movementName, movementWeight, movementSets, movementReps);

    document.querySelector(`.movement__list[data-setid="${setId}"]`).appendChild(
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
        <div class="set__header">
            <h1 class="set__title">Superset ${setNumber}</h1>
            <div class="progress-bar"></div>
            <button class="movement__add-new">
                <img src="/img/add.svg" alt="">
                Add movement
            </button>
        </div>
        <ul class="movement__list" data-setid="${setNumber}">
        </ul>
    `;

    set.querySelector('.movement__add-new').addEventListener('click', () => {
        addMovementOverlay.classList.add('overlay--visible');
        document.querySelector('.movement--add-form').setAttribute('data-setid', set.querySelector('.movement__add-new').parentNode.parentNode.getAttribute('data-setid'));
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

    APIRequest('GET', 'journal/movement', movementId).then(movementLog => {
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