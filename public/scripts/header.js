const mainMenu = document.querySelector('.menu');
const menuCloseButton = document.querySelector('.menu__close');
const menuButton = document.querySelector('.header__menu-button');
const addRoutineButton = document.querySelector('.menu__create-routine');
const cancelAddRoutineButton = document.querySelector('.menu__cancel-add');
const addRoutineField = document.querySelector('.menu__add-routine>input[type="text"]');
const addRoutineForm = document.querySelector('.menu__add-routine');
const routineList = document.querySelector('.menu__routine-list');

function menuFunctionality() {

	menuButton.addEventListener('click', (e) => {
		mainMenu.classList.add('menu--active');
	});

	menuCloseButton.addEventListener('click', (e) => {
		mainMenu.classList.remove('menu--active');
	});

	addRoutineButton.addEventListener(`click`, (e) => {
		if (addRoutineForm.classList.contains('menu__add-routine--visible')) {
			addRoutine();
		} else {
			addRoutineForm.classList.add('menu__add-routine--visible');
			addRoutineButton.innerHTML = `<img src="/img/add.svg" alt="">Save routine`;
			addRoutineField.focus();
		}
	});

	cancelAddRoutineButton.addEventListener('click', (e) => {
		addRoutineForm.classList.remove('menu__add-routine--visible');
		addRoutineButton.innerHTML = `<img src="/img/add.svg" alt="">Create a routine`;
	});
}

function addRoutine() {
	let orderFigure = document.querySelectorAll('.menu__routine').length;
	APIRequest('post', '/addroutine', addRoutineField.value, orderFigure);

	let listItem = document.createElement('li');
	listItem.classList.add('menu__routine');
	listItem.setAttribute('data-order', orderFigure);

	listItem.innerHTML = `
		<a href="">${addRoutineField.value}</a>
		<aside class="menu__routine-completed">-</aside>
		<button class="menu__routine-drag-handle"></button>
	`;

	// let routineName = document.createElement('p');
	// routineName.innerText = addRoutineField.value;
	// listItem.appendChild(routineName);

	// let dateCompleted = document.createElement('aside');
	// dateCompleted.classList.add('menu__routine-completed');
	// dateCompleted.innerText = '-';
	// listItem.appendChild(dateCompleted);

	// let dragHandle = document.createElement('button');
	// dragHandle.classList.add('menu__routine-drag-handle');
	// listItem.appendChild(dragHandle);

	routineList.insertBefore(listItem, addRoutineForm);
	addRoutineForm.classList.remove('menu__add-routine--visible');
}

readyFunctions.push(menuFunctionality);