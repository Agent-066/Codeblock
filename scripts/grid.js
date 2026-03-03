    document.addEventListener('DOMContentLoaded', function() {
        const gridToggle = document.getElementById('grid-toggle-btn');
        const safeZone = document.querySelector('.safe-zone');
        
        if (gridToggle && safeZone) {
            gridToggle.addEventListener('click', function() {
                safeZone.classList.toggle('no-grid');
                if (safeZone.classList.contains('no-grid')) {
                    this.textContent = '⊟';
                } else {
                    this.textContent = '⊞';
                }
            });
        }
    });
    
    document.addEventListener('DOMContentLoaded', function() {
    const safeZone = document.querySelector('.safe-zone');
    
    function updateBackgroundPosition() {
        const scrollTop = safeZone.scrollTop;
        const scrollLeft = safeZone.scrollLeft;
        
        // Смещаем фон в обратную сторону от скролла
        safeZone.style.backgroundPosition = `-${scrollLeft}px -${scrollTop}px`;
    }
    
    safeZone.addEventListener('scroll', updateBackgroundPosition);
});