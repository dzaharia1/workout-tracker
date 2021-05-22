var readyFunction = function() {
	const mainMenu = document.querySelector('.menu');
	const menuCloseButton = document.querySelector('.menu__close');
	const menuButton = document.querySelector('.header__menu-button');

	menuButton.addEventListener('click', (e) => {
		mainMenu.classList.add('menu--active');
	});

	menuCloseButton.addEventListener('click', (e) => {
		mainMenu.classList.remove('menu--active');
	});
}

if (document.readyState != 'loading') {
	readyFunction();
}
else {
	document.addEventListener('DOMContentLoaded', readyFunction)
}