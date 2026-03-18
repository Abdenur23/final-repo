// wipikit/app.js
// Core app namespace, scalable. Handles modal open/close.

window.WePickItSF = window.WePickItSF || {};

(function(NS) {
    'use strict';

    // DOM elements
    const overlay = document.getElementById('bookingModalOverlay');
    const openBtn = document.getElementById('openBookingBtn');
    const closeBtn = document.getElementById('closeModalBtn');

    // state
    let modalOpen = false;

    // public methods
    NS.openModal = function openModal() {
        if (!overlay) return;
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';     // prevent background scroll
        modalOpen = true;
    };

    NS.closeModal = function closeModal() {
        if (!overlay) return;
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        modalOpen = false;

        // optional: reset form to pristine (but keep any confirmation hidden – booking.js will handle)
        const form = document.getElementById('bookingForm');
        const thankYou = document.getElementById('thankYouMessage');
        if (form) form.reset();
        if (thankYou) thankYou.hidden = true;
        if (form) form.hidden = false;
    };

    NS.isModalOpen = function isModalOpen() {
        return modalOpen;
    };

    // attach event listeners
    function initModal() {
        if (!overlay || !openBtn || !closeBtn) {
            console.warn('Modal elements missing – still safe.');
            return;
        }

        openBtn.addEventListener('click', NS.openModal);
        closeBtn.addEventListener('click', NS.closeModal);

        // click outside the modal card closes it
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {   // click on the overlay background
                NS.closeModal();
            }
        });

        // ESC key closes modal
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && NS.isModalOpen()) {
                NS.closeModal();
            }
        });
    }

    // start on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initModal);
    } else {
        initModal();
    }

})(window.WePickItSF);
