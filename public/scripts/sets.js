let addMovementButtons = document.querySelectorAll('.movement__add-new');
let saveMomementButtons = document.querySelectorAll('.movement__save-button');
const addSetButton = document.querySelector('.set__add-new');
const routineId = document.querySelector('.header').getAttribute('data-routineid');

function setsFunctionality() {
    for (let thisButton of addMovementButtons) {
        thisButton.addEventListener('click', (e) => {
            let form = thisButton.parentNode.parentNode.querySelector('.movement--add-form');
            form.classList.add('movement--add-form--visible');
        });
    }
    
    for (let thisButton of saveMomementButtons) {
        thisButton.addEventListener('click', () => {
            console.log('adding movement');
            saveMovement(thisButton.parentNode.parentNode, thisButton);
        });
    }

    addSetButton.addEventListener('click', () => {
        document.querySelector('.set__list').insertBefore(createSetNode(), addSetButton.parentNode);
    });
}

function saveMovement(form, saveButton) {
    let movementName = form.querySelector('.movement__name-field').value;
    let movementWeight = form.querySelector('input[name="weight"]').value;
    let movementSets = form.querySelector('input[name="sets"]').value;
    let movementReps = form.querySelector('input[name="reps"]').value;
    let routineId = saveButton.getAttribute('data-routineid');
    let setId = saveButton.getAttribute('data-setid');
    let newNode = createMovementNode(movementName, movementWeight, movementSets, movementReps);
    form.parentNode.insertBefore(newNode, form);
    form.classList.remove('movement--add-form--visible');
    APIRequest('post', 'addmovement', routineId, setId, movementName, movementWeight, movementSets, movementReps);

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
            <button class="movement__journal-button"></button>
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
        <ul class="movement__list">
        <li class="movement movement--add-form">
                <div class="movement__header">
                    <input type="text" class="movement__name-field" placeholder="Movement name">
                    <button class="movement__save-button" data-routineid="${routineId}" data-setid="${setNumber}"></button>
                </div>
                <p class="movement__thing">Properties:</p>
                <div class="movement__properties">
                    <div class="movement__property">
                        <label for="weight">lbs</label>
                        <input type="number" name="weight" id="" placehoder="-">
                    </div>
                    <div class="movement__property-divider"></div>
                    <div class="movement__property">
                        <label for="sets">Sets</label>
                        <input type="number" name="sets" id="" placehoder="-">
                    </div>
                    <div class="movement__property-divider"></div>
                    <div class="movement__property">
                        <label for="reps">Reps</label>
                        <input type="number" name="reps" id="" placehoder="-">
                    </div>
                </div>
            </li>
            <li class="movement__add">
                <button class="movement__add-new text-button" data-routineid="${routineId}" data-setid="${setNumber}">
                    Add a movement
                </button>
            </li>
        </ul>
    `;

    set.querySelector('.movement__add-new').addEventListener('click', () => {
        set.querySelector('.movement--add-form').classList.add('movement--add-form--visible');
    });

    set.querySelector('.movement__save-button').addEventListener('click', () => {
        console.log('adding movement');
        saveMovement(set.querySelector('.movement--add-form'), set.querySelector('.movement__save-button'));
    });

    return set;
}

readyFunctions.push(setsFunctionality);