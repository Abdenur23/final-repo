// wipikit/booking.js
// Modular booking logic – handles form submission, thank you message, and future slot availability.

(function(NS) {
    'use strict';

    const form = document.getElementById('bookingForm');
    const thankYouDiv = document.getElementById('thankYouMessage');

    // Helper to show thank you and hide form
    function showThankYou() {
        if (form) form.hidden = true;
        if (thankYouDiv) {
            thankYouDiv.hidden = false;
            // optional: focus on thank you for a11y
            thankYouDiv.setAttribute('tabindex', '-1');
            thankYouDiv.focus({ preventScroll: false });
        }
    }

    // Helper to reset to form view (used by app.js closeModal, but can be public)
    function resetToForm() {
        if (form) {
            form.hidden = false;
            form.reset();
        }
        if (thankYouDiv) thankYouDiv.hidden = true;
    }

    // Handle submission (simulate async, show confirmation)
    function handleSubmit(event) {
        event.preventDefault();

        // simple validation (browser handles required, but double-check)
        const name = document.getElementById('name')?.value.trim();
        const address = document.getElementById('address')?.value.trim();
        const neighborhood = document.getElementById('neighborhood')?.value;
        const timeSlot = document.querySelector('input[name="timeSlot"]:checked')?.value;

        if (!name || !address || !neighborhood || !timeSlot) {
            alert('please fill all fields – we need to know where to e‑bike.');
            return;
        }

        // In a future version, we could check available slots per neighborhood.
        // Simulate a small delay for realism (scalability)
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'booking...';
        }

        // mimic async request (e.g., fetch to server / or local slot check)
        setTimeout(() => {
            // after successful booking, show thank you message
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'confirm pickup';
            }
            showThankYou();

            // log for scalability: you could later push booking to an array
            console.log(`booking confirmed for ${name} in ${neighborhood} (${timeSlot})`);

            // (modal stays open; user closes via X or outside)
        }, 400);
    }

    // public method to programmatically reset (used by app if needed)
    NS.resetBookingUI = resetToForm;

    // attach listener when DOM ready
    function initBooking() {
        if (!form) {
            console.warn('Booking form not found');
            return;
        }

        form.addEventListener('submit', handleSubmit);

        // also ensure that when modal closes, the ui goes back to form state
        // (we hook into modal close via app.js, but double-check here with custom event)
        const overlay = document.getElementById('bookingModalOverlay');
        if (overlay) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mut) => {
                    if (mut.attributeName === 'aria-hidden') {
                        const hidden = overlay.getAttribute('aria-hidden') === 'true';
                        if (hidden) {
                            // modal closed: reset to form view
                            resetToForm();
                        }
                    }
                });
            });
            observer.observe(overlay, { attributes: true });
        }

        // initial hidden state for thank you
        if (thankYouDiv) thankYouDiv.hidden = true;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBooking);
    } else {
        initBooking();
    }

    // Optional: export for future scalability (e.g., slot finder)
    NS.fetchAvailableSlots = function(neighborhood) {
        // stub for future: return promise with time slots per hood
        return Promise.resolve(['Morning', 'Afternoon', 'Evening']);
    };

})(window.WePickItSF || (window.WePickItSF = {}));
