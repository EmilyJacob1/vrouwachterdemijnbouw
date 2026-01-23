# Wijzigingen voor muzieknoten GIF

## 1. HTML wijziging in index.html (regel 68-72):

Vervang:
```html
            <div class="slide slide-studeerkamer">
                <button class="glow-button glow-button-green-studeerkamer"
                    onclick="toggleAudio('zusjes-lied')"></button>
                <button class="glow-button glow-button-pink-studeerkamer" onclick="openModal('modal-three')"></button>
            </div>
```

Door:
```html
            <div class="slide slide-studeerkamer">
                <button class="glow-button glow-button-green-studeerkamer"
                    onclick="toggleAudio('zusjes-lied')"></button>
                <img id="music-notes-gif" class="music-notes-animation" src="imgs-audio/vrdieping-studeerkamer/musicnotes.gif" alt="Music notes" style="display:none;">
                <button class="glow-button glow-button-pink-studeerkamer" onclick="openModal('modal-three')"></button>
            </div>
```

## 2. CSS toevoegen aan styles.css (na de .glow-button-green-studeerkamer sectie):

```css
/* Music notes animation for radio */
.music-notes-animation {
  position: absolute;
  top: 20%;
  left: 12%;
  width: 120px;
  height: 120px;
  pointer-events: none;
  z-index: 101;
}
```

## 3. JavaScript wijziging in audio.js (in de toggleAudio functie):

Vervang de toggleAudio functie (vanaf regel 153) door:
```javascript
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

    // Get music notes GIF element
    const musicNotesGif = document.getElementById('music-notes-gif');

    // Toggle current audio
    if (audioElement.paused) {
        audioElement.play().catch(() => {
            console.log('Could not play audio');
        });
        currentAudioId = audioId;
        
        // Show music notes GIF
        if (musicNotesGif) {
            musicNotesGif.style.display = 'block';
        }
    } else {
        audioElement.pause();
        currentAudioId = null;
        
        // Hide music notes GIF
        if (musicNotesGif) {
            musicNotesGif.style.display = 'none';
        }
    }
}
```

## 4. Ook de stopAllAudio functie aanpassen om het GIF te verbergen:

Vervang de stopAllAudio functie door:
```javascript
function stopAllAudio() {
    // Stop all user-triggered audio elements
    document.querySelectorAll('audio').forEach(audio => {
        if (!audio.paused) {
            audio.pause();
            audio.currentTime = 0;
        }
    });
    currentAudioId = null;
    
    // Hide music notes GIF
    const musicNotesGif = document.getElementById('music-notes-gif');
    if (musicNotesGif) {
        musicNotesGif.style.display = 'none';
    }
}
```
