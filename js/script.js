// Swipe icon timer
let swipeIconTimer = null;

// Show swipe icon for 4 seconds
function showSwipeIcon() {
    const swipeIcon = document.getElementById('swipeIcon');
    if (!swipeIcon) return;
    
    // Clear any existing timer
    if (swipeIconTimer) {
        clearTimeout(swipeIconTimer);
    }
    
    // Show the icon
    swipeIcon.classList.add('show');
    
    // Hide it after 4 seconds
    swipeIconTimer = setTimeout(() => {
        swipeIcon.classList.remove('show');
    }, 4000);
}

// Wisselen tussen de secties (Start -> Video -> Scrolly)
function showSection(id) {
    // Verberg alle pagina's
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    
    // Toon de gekozen pagina
    const target = document.getElementById(id);
    if (target) {
        target.classList.remove('hidden');
    }

    // Pauzeer video als we niet op de videopagina zijn
    const video = document.getElementById('introVideo');
    if (video && id !== 'video-page') {
        video.pause();
    }

    // If showing video page, ensure Vimeo player plays and request fullscreen.
    if (id === 'video-page' && window.vimeoPlayer) {
        // Attempt to play (player was created earlier)
        window.vimeoPlayer.play().catch(() => {
            // Autoplay may be blocked unless muted; we already started muted in iframe query string.
        });

        // Request fullscreen on the video container so the iframe takes entire screen
        const container = document.getElementById('videoContainer');
        if (container && container.requestFullscreen) {
            container.requestFullscreen().catch(() => {/* ignore fullscreen failures */});
        } else if (container && container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        }
    }

    // Pauzeer Vimeo video als we niet op de videopagina zijn
    if (id !== 'video-page' && window.vimeoPlayer) {
        window.vimeoPlayer.pause().catch(() => {
            // ignore if pause fails
        });
    }

    // Exit fullscreen whenever we switch to the scrollytelling
    if (id === 'scrolly-page') {
        try {
            if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
                if (document.exitFullscreen) {
                    document.exitFullscreen().catch(()=>{});
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }
        } catch (e) {
            // ignore
        }

        // klein timeout zodat DOM/layout klaar is
        setTimeout(() => updateActiveDot(), 50);
        
        // Show swipe icon when scrolly page starts
        showSwipeIcon();
    }
}

// Horizontaal scrollen met het muiswiel
const scrollContainer = document.getElementById("scrollContainer");

window.addEventListener("wheel", (evt) => {
    const scrollyPage = document.getElementById('scrolly-page');
    const openModal = document.querySelector('.modal:not(.hidden)');
    
    // Als een modal open is, laat normaal scrolling toe (voor modal-body)
    if (openModal) {
        return;
    }
    
    // Alleen horizontaal scrollen als de scrollytelling-pagina actief is
    if (!scrollyPage.classList.contains('hidden')) {
        evt.preventDefault();
        // Beide verticaal (deltaY) en horizontaal (deltaX) omzetten naar horizontaal scrollen
        // Dit ondersteunt zowel muiswiel als trackpad swipes
        const scrollAmount = evt.deltaY + evt.deltaX;
        document.getElementById('scrollContainer').scrollLeft += scrollAmount;
    }
}, { passive: false });

// Navigatie via de puntjes
function navTo(slideIndex) {
    const container = document.getElementById('scrollContainer');
    if (!container) return;
    const slides = Array.from(container.querySelectorAll('.slide'));
    const target = slides[slideIndex];
    if (target) {
        container.scrollTo({
            left: target.offsetLeft,
            behavior: 'smooth'
        });
    }

    // zodra er via de dot genavigeerd wordt, toon direct de actieve status
    setActiveDot(slideIndex);
}

function resetToStart() {
    // Simple reset: reloads the page to initial state
    window.location.reload();
}

// update active dot based on current scroll position
function updateActiveDot() {
    const container = document.getElementById('scrollContainer');
    if (!container) return;
    const slides = Array.from(container.querySelectorAll('.slide'));
    if (slides.length === 0) return;

    const center = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Infinity;

    slides.forEach((s, i) => {
        const slideCenter = s.offsetLeft + s.offsetWidth / 2;
        const dist = Math.abs(center - slideCenter);
        if (dist < closestDistance) {
            closestDistance = dist;
            closestIndex = i;
        }
    });

    setActiveDot(closestIndex);
}

function setActiveDot(index) {
    const dots = document.querySelectorAll('.bottom-nav .dot');
    if (!dots || dots.length === 0) return;
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
}

// Throttled scroll listener to update active dot
(function attachScrollListener(){
    const container = document.getElementById('scrollContainer');
    if (!container) return;
    let ticking = false;
    container.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateActiveDot();
                ticking = false;
            });
            ticking = true;
        }
    });

    window.addEventListener('resize', () => updateActiveDot());
})();

// Vimeo player setup
(function setupVimeo(){
    // Wait for the API and iframe to exist
    const iframe = document.getElementById('vimeoPlayer');
    if (!iframe || typeof Vimeo === 'undefined') {
        // try again shortly if DOM/API not ready
        setTimeout(setupVimeo, 200);
        return;
    }

    // Create player
    window.vimeoPlayer = new Vimeo.Player(iframe);

    // When player is ready, make sure it's muted (allows autoplay)
    // DO NOT autoplay here - wait for showSection to be called with 'video-page'
    window.vimeoPlayer.ready().then(() => {
        // ensure muted so browsers allow autoplay
        window.vimeoPlayer.setVolume(0).catch(()=>{});
    }).catch(()=>{});

    // When video ends, exit fullscreen (if any) and go to scrolly page
    window.vimeoPlayer.on('ended', function() {
        // exit fullscreen if possible
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(()=>{});
        }
        showSection('scrolly-page');
    });

    // Many browsers require a user gesture to unmute. Provide a handler to unmute on first interaction.
    function tryUnmuteOnInteraction() {
        window.vimeoPlayer.getVolume().then(vol => {
            if (vol === 0) {
                window.vimeoPlayer.setVolume(1).catch(()=>{});
            }
        }).catch(()=>{});
        window.removeEventListener('click', tryUnmuteOnInteraction);
        window.removeEventListener('keydown', tryUnmuteOnInteraction);
    }
    window.addEventListener('click', tryUnmuteOnInteraction);
    window.addEventListener('keydown', tryUnmuteOnInteraction);
})();

// Modal functionality
let modalSwipeIconTimer = null;

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        // Remove hidden class to make modal visible but still at opacity 0
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Force a reflow to ensure the transition happens
        void modal.offsetWidth;
        
        // Add 'show' class to trigger the transition
        requestAnimationFrame(() => {
            modal.classList.add('show');
            
            // Show swipe icon and hide it after 3 seconds
            const swipeIcon = modal.querySelector('.modal-swipe-icon');
            if (swipeIcon) {
                // Clear any existing timer
                if (modalSwipeIconTimer) {
                    clearTimeout(modalSwipeIconTimer);
                }
                
                // Hide icon after 3 seconds
                modalSwipeIconTimer = setTimeout(() => {
                    swipeIcon.style.opacity = '0';
                }, 3000);
            }
        });
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        // Clear swipe icon timer when closing
        if (modalSwipeIconTimer) {
            clearTimeout(modalSwipeIconTimer);
        }
        
        // Remove show class to trigger closing animation
        modal.classList.remove('show');
        
        // Wait for transition to complete before adding hidden class
        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.style.overflow = 'hidden';
        }, 300); // Match the CSS transition duration
    }
}

// Close modal on Escape key
document.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape') {
        document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
            closeModal(modal.id);
        });
    }
});