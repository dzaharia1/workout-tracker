let closeButtons = document.querySelectorAll('.overlay__close-button');

function overlaySetup () {
    for (let thisButton of closeButtons) {
        thisButton.addEventListener('click', () => {
            let overlay = thisButton.parentNode.parentNode;
            overlay.classList.remove('overlay--visible');
        });
    }
}

readyFunctions.push(overlaySetup);