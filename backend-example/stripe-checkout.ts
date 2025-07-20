// This is an example of a serverless function to create a Stripe Checkout session.
// You would deploy this to a service like Vercel, Netlify, or AWS Lambda.
// It securely handles the creation of payment links.

// The function would be accessible at an endpoint like `api/create-checkout-session`.

// You would need to install the stripe sdk: npm install stripe
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
});

// Example for Vercel Serverless Function
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { priceId, userEmail } = req.body;

    if (!priceId) {
      return res.status(400).json({ message: 'Price ID is required.' });
    }

    const YOUR_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; // Change to your app's URL

    // See https://stripe.com/docs/api/checkout/sessions/create
    // for more options
    const params: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription', // Use 'payment' for one-time purchases
      success_url: `${YOUR_DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/pricing`,
      // Pre-fill the user's email if available
      ...(userEmail && { customer_email: userEmail }),
    };

    // For one-time purchases, the mode should be 'payment'
    // You would need to know which products are subscriptions vs. one-time
    // These MUST match the price IDs for one-time purchases in your constants.ts file.
    const oneTimePurchasePriceIds = [
      'price_launchpad_297',
      'price_ultimate_497',
    ];

    if (oneTimePurchasePriceIds.includes(priceId)) {
        params.mode = 'payment';
    }


    const checkoutSession: Stripe.Checkout.Session = await stripe.checkout.sessions.create(params);

    res.status(200).json({ sessionId: checkoutSession.id });

  } catch (err) {
    console.error('Error creating Stripe session:', err);
    res.status(500).json({ message: 'Failed to create payment session.' });
  }
}

/**
 * Note on Webhooks:
 * For a robust, production-ready application, you should not fulfill orders based on the success_url redirect alone.
 * A user could bookmark the success page and access it without paying.
 *
 * Instead, you should create a Stripe Webhook endpoint (e.g., `api/stripe-webhook`).
 * This endpoint will listen for the `checkout.session.completed` event from Stripe.
 * When this event is received, you can securely update the user's profile in your database,
 * granting them access to the features they purchased.
 * This is the most reliable way to handle order fulfillment.
 */
