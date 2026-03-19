// /wipikit/app.js

// this file handles the UI interactions: opening modal, closing, etc.
// It also holds the config for the API endpoint (to be set later)

window.DRIFT_CONFIG = {
    apiEndpoint: 'https://your-api-gateway.execute-api.us-west-1.amazonaws.com/prod/drift' // replace later
};

document.addEventListener('DOMContentLoaded', function() {
    const openBtn = document.getElementById('actionBtn');
    const modal = document.getElementById('modalOverlay');
    const cancelBtn = document.getElementById('cancelModal');

    // open modal
    if (openBtn) {
        openBtn.addEventListener('click', function() {
            modal.classList.add('active');
        });
    }

    // close modal via cancel
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            modal.classList.remove('active');
        });
    }

    // close if click outside modal card (on overlay)
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // smooth scroll for top-right trigger
    const scrollTrigger = document.getElementById('moveDown');
    const target = document.getElementById('target');
    if (scrollTrigger && target) {
        scrollTrigger.addEventListener('click', function() {
            target.scrollIntoView({ behavior: 'smooth' });
        });
    }
});
