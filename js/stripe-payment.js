/**
 * // js/stripe-payment.js
 * * Client-side Stripe integration script for TheWeer.com.
 * This script interacts with the serverless Lambda function to handle
 * Stripe Checkout session creation and retrieval of session/order details.
 */

// Initialize Stripe with your publishable key
// Replace 'pk_test_YOUR_PUBLISHABLE_KEY' with your actual Stripe Publishable Key.
const stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);

// Replace with your Lambda API Gateway endpoint URL
const LAMBDA_API_ENDPOINT = CONFIG.CHECKOUT_API_ENDPOINT; 

/**
 * Calls the Lambda API with a specific action and payload.
 * @param {string} action - The action for the Lambda function (e.g., 'createCheckoutSession').
 * @param {object} payload - The data to send in the request body.
 * @returns {Promise<object>} The JSON response from the Lambda.
 */
async function callLambdaApi(action, payload) {
    try {
        const response = await fetch(LAMBDA_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: action,
                ...payload
            })
        });

        const data = await response.json();

        if (response.ok) {
            if (data.error) {
                throw new Error(data.error);
            }
            return data;
        } else {
            // Handle non-200 responses, which still might contain a body
            const errorMessage = data.error || `HTTP error! Status: ${response.status}`;
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error(`Lambda API call failed for action '${action}':`, error);
        throw error;
    }
}

/**
 * Initiates the Stripe Checkout process.
 * Calls the Lambda to create a session and redirects the user.
 * @param {string} userEmail - The customer's email.
 * @param {number} amount - The total amount in cents.
 * @param {Array<object>} cartItems - The list of items in the cart.
 * @param {number} itemCount - The total number of unique/distinct items.
 */
async function initiateStripeCheckout(userEmail, amount, cartItems, itemCount) {
    if (!stripe) {
        console.error("Stripe is not initialized. Check your publishable key.");
        alert("Payment system error. Please try again later.");
        return;
    }

    try {
        // 1. Call the Lambda to create the Stripe Checkout Session
        const sessionResponse = await callLambdaApi('createCheckoutSession', {
            user_email: userEmail,
            amount: amount,
            cart_items: cartItems,
            item_count: itemCount
        });

        const sessionId = sessionResponse.id;

        // 2. Redirect to Stripe Checkout
        const result = await stripe.redirectToCheckout({
            sessionId: sessionId
        });

        if (result.error) {
            console.error("Stripe redirect failed:", result.error.message);
            alert(`Payment failed: ${result.error.message}`);
        }

    } catch (error) {
        console.error("Error during checkout initiation:", error);
        alert(`Could not start payment process: ${error.message || 'Internal error.'}`);
    }
}

/**
 * Retrieves Stripe session and order details after a successful checkout.
 * Should be called on the success page (e.g., 'success.html').
 * @param {string} sessionId - The Stripe Checkout Session ID from the URL query parameter.
 * @returns {Promise<object | null>} The session and order data or null on failure.
 */
async function getSessionAndOrderDetails(sessionId) {
    if (!sessionId) {
        console.error("Missing Stripe Session ID.");
        return null;
    }

    try {
        // 1. Call the Lambda to retrieve session and order details
        const details = await callLambdaApi('getSessionDetails', {
            session_id: sessionId
        });

        // 2. Optionally, mark the order as 'COMPLETED' after showing details/confirmation
        if (details && details.order_status !== 'COMPLETED') {
            await callLambdaApi('completeOrder', {
                session_id: sessionId
            });
            // Update the status locally for display, though a refresh would re-fetch.
            details.order_status = 'COMPLETED'; 
        }

        return details;

    } catch (error) {
        console.error("Error fetching session and order details:", error);
        // You might want to display a generic error or retry button here
        return null;
    }
}

// Export functions if using a module system, otherwise they are global.
// For a simple script, leaving them global is common.
// If your environment supports ES Modules:
// export { initiateStripeCheckout, getSessionAndOrderDetails, stripe };

// Example Usage (for demonstration purposes, assumes an HTML structure):
// ----------------------------------------------------------------------

// Example: Handling checkout on a cart page
// document.getElementById('checkout-button').addEventListener('click', () => {
//     const userEmail = 'test@example.com'; // Get from user session/input
//     const cart = [{ id: 'case-1', paletteName: 'Ocean Blue' }, { id: 'case-2', paletteName: 'Midnight Black' }]; // Get from cart state
//     const totalAmountCents = 2499; // Total amount in cents

//     initiateStripeCheckout(userEmail, totalAmountCents, cart, cart.length);
// });

// Example: Handling retrieval on a success page (success.html?session_id=cs_...)
// window.onload = () => {
//     const urlParams = new URLSearchParams(window.location.search);
//     const sessionId = urlParams.get('session_id');

//     if (sessionId) {
//         getSessionAndOrderDetails(sessionId)
//             .then(details => {
//                 if (details) {
//                     console.log("Payment successful! Order Details:", details);
//                     // Update the DOM with the details (e.g., show confirmation)
//                     // document.getElementById('order-status').textContent = details.order_status;
//                     // document.getElementById('customer-email').textContent = details.customer_email;
//                 } else {
//                     // Handle case where details couldn't be fetched
//                     // document.getElementById('order-status').textContent = 'Error: Could not retrieve order details.';
//                 }
//             });
//     }
// };
