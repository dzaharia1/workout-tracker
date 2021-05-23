const addMovementButtons = document.querySelectorAll('.movement__add-new');
const addSetButton = document.querySelector('.set__add-new');
const saveMomementButtons = document.querySelectorAll('.movement__save-button');

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
            let form = thisButton.parentNode.parentNode;
            let movementName = form.querySelector('.movement__name-field').value;
            let movementWeight = form.querySelector('input[name="weight"]').value;
            let movementSets = form.querySelector('input[name="sets"]').value;
            let movementReps = form.querySelector('input[name="reps"]').value;
            let routineId = thisButton.getAttribute('data-routineid');
            let setId = thisButton.getAttribute('data-setid');
            let newNode = createMovementNode(movementName, movementWeight, movementSets, movementReps);
            form.parentNode.insertBefore(newNode, form);
            form.classList.remove('movement--add-form--visible');
            APIRequest('post', 'addmovement', routineId, setId, movementName, movementWeight, movementSets, movementReps);
        });
    }
}

function createMovementNode(name, weight, sets, reps) {
    let container = document.createElement('div');
    container.classList.add('movement');

    container.innerHTML = `
        <div class="movement__header">
            <h3 class="movement__name">${name}</h3>
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

readyFunctions.push(setsFunctionality);