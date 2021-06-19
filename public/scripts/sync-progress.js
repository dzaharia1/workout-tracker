function syncProgress(routineId) {
    APIRequest('GET', 'movements', routineId)
    .then(movements => {
        for (let movement of movements) {
            indicators = document.querySelectorAll(`.progress-step[data-movementid="${movement.movement_id}"`);
            for (let indicator of indicators) {
                if (movement.to_char === today) {
                    indicator.classList.add('progress-step--completed');
                } else {
                    indicator.classList.remove('progress-step--completed');
                }
            }
        }
    });
}