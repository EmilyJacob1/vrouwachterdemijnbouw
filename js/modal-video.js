// Modal video with play button functionality
function playModalVideo(videoId, containerId) {
    const iframe = document.getElementById(videoId);
    const container = document.getElementById(containerId);
    
    if (!iframe || !container) return;
    
    // Show the iframe
    iframe.style.display = 'block';
    
    // Hide the play button
    const playButton = container.querySelector('.modal-video-play-button');
    if (playButton) {
        playButton.style.display = 'none';
    }
    
    // Initialize and play the video
    const player = new Vimeo.Player(iframe);
    player.play().catch(() => {
        console.log('Video autoplay may be blocked');
    });
}
