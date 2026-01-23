// Background noise system for scrollytelling

const AudioManager = {
    // Map of slide index to background audio file
    backgroundAudioMap: {
        1: 'imgs-audio/horizontaal-illustraties/vogels.mp3',
        3: 'imgs-audio/horizontaal-illustraties/fabrieksgeluiden.mp3',
        4: 'imgs-audio/horizontaal-illustraties/kinderen.mp3',
        7: 'imgs-audio/horizontaal-illustraties/vogels.mp3'
    },

    // Current background audio element
    currentAudio: null,
    currentSlide: null,

    /**
     * Initialize background audio for a given slide index
     * @param {number} slideIndex - The index of the slide
     */
    playBackgroundAudio(slideIndex) {
        // If audio is already playing for this slide, do nothing
        if (this.currentSlide === slideIndex && this.currentAudio && !this.currentAudio.paused) {
            return;
        }

        // Stop any currently playing audio
        this.stopBackgroundAudio();

        // Check if this slide has background audio
        if (!this.backgroundAudioMap[slideIndex]) {
            return;
        }

        // Create and play new audio
        this.currentAudio = new Audio(this.backgroundAudioMap[slideIndex]);
        this.currentAudio.loop = true;
        this.currentAudio.volume = 0.5; // Adjust volume as needed
        this.currentAudio.play().catch(err => {
            console.warn('Failed to play background audio:', err);
        });

        this.currentSlide = slideIndex;
    },

    /**
     * Stop the currently playing background audio
     */
    stopBackgroundAudio() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }
        this.currentSlide = null;
    },

    /**
     * Check current slide and update background audio
     * Called on scroll events
     */
    updateBackgroundAudio() {
        const container = document.getElementById('scrollContainer');
        if (!container) return;

        const slides = Array.from(container.querySelectorAll('.slide'));
        if (slides.length === 0) return;

        // Find the slide closest to the center of the viewport
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

        // Play background audio for the closest slide
        this.playBackgroundAudio(closestIndex);
    }
};

// Attach scroll listener for background audio updates
(function attachAudioScrollListener() {
    const container = document.getElementById('scrollContainer');
    if (!container) {
        setTimeout(attachAudioScrollListener, 200);
        return;
    }

    let ticking = false;
    container.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                // Stop user-triggered audio when scrolling
                stopAllAudio();
                AudioManager.updateBackgroundAudio();
                ticking = false;
            });
            ticking = true;
        }
    });

    // Initial check when scrolly page is shown
    const scrollyPage = document.getElementById('scrolly-page');
    const observer = new MutationObserver(() => {
        if (!scrollyPage.classList.contains('hidden')) {
            AudioManager.updateBackgroundAudio();
        }
    });

    observer.observe(scrollyPage, { attributes: true, attributeFilter: ['class'] });
})();

// Stop background audio when modals open
(function setupModalAudioHandling() {
    const originalOpenModal = window.openModal;
    window.openModal = function (modalId) {
        AudioManager.stopBackgroundAudio();
        stopAllAudio();
        originalOpenModal.call(this, modalId);
    };

    const originalCloseModal = window.closeModal;
    window.closeModal = function (modalId) {
        originalCloseModal.call(this, modalId);
        // Resume background audio after modal closes
        setTimeout(() => {
            AudioManager.updateBackgroundAudio();
        }, 350); // Wait for modal closing animation to complete
    };
})();

// Stop background audio when switching sections
(function setupSectionAudioHandling() {
    const originalShowSection = window.showSection;
    window.showSection = function (id) {
        // Stop background audio when leaving scrolly page
        if (id !== 'scrolly-page') {
            AudioManager.stopBackgroundAudio();
            stopAllAudio();
        }
        originalShowSection.call(this, id);
    };
})();

// User-triggered audio control functionality
let currentAudioId = null;

function toggleAudio(audioId) {
    const audioElement = document.getElementById(audioId);
    if (!audioElement) {
        console.log('Audio element not found:', audioId);
        return;
    }

    // Stop background audio when playing user audio
    AudioManager.stopBackgroundAudio();

    // If a different audio is playing, stop it
    if (currentAudioId && currentAudioId !== audioId) {
        const previousAudio = document.getElementById(currentAudioId);
        if (previousAudio) {
            previousAudio.pause();
            previousAudio.currentTime = 0;
        }
    }

    // Toggle current audio
    if (audioElement.paused) {
        audioElement.play().catch(() => {
            console.log('Could not play audio');
        });
        currentAudioId = audioId;
    } else {
        audioElement.pause();
        currentAudioId = null;
    }
}

function stopAllAudio() {
    // Stop all user-triggered audio elements
    document.querySelectorAll('audio').forEach(audio => {
        if (!audio.paused) {
            audio.pause();
            audio.currentTime = 0;
        }
    });
    currentAudioId = null;
}
