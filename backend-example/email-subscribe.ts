// This is an example of a serverless function to handle email subscriptions securely.
// You would deploy this to a service like Vercel, Netlify, or AWS Lambda.
// It assumes you are using Mailchimp, but the pattern is similar for other services.

// The function would be accessible at an endpoint like `api/subscribe`.

// You would need to install node-fetch: npm install node-fetch
import fetch from 'node-fetch';

// Example for Vercel Serverless Function
export default async function handler(req, res) {
  // 1. Check for POST request
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { email } = req.body;

  // 2. Validate email
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ message: 'A valid email address is required.' });
  }

  // 3. Get secrets from environment variables
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const listId = process.env.MAILCHIMP_LIST_ID;
  // The Mailchimp API data center is the part of the API key after the hyphen (e.g., 'us1', 'us20')
  const dataCenter = apiKey ? apiKey.split('-')[1] : null;

  if (!apiKey || !listId || !dataCenter) {
    console.error('Mailchimp environment variables not set.');
    return res.status(500).json({ message: 'Subscription service is not configured correctly.' });
  }

  // 4. Construct payload for Mailchimp API
  const data = {
    email_address: email,
    status: 'subscribed',
  };

  const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/members`;

  // 5. Make the API call to Mailchimp
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Mailchimp uses Basic Auth with any username and the API key as the password
        'Authorization': `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
      },
      body: JSON.stringify(data),
    });

    if (response.status >= 400) {
      const errorData = await response.json();
      // Handle cases where the user is already subscribed
      if (errorData.title === 'Member Exists') {
        return res.status(200).json({ message: "You're already subscribed!" });
      }
      console.error('Mailchimp API Error:', errorData);
      return res.status(400).json({ message: errorData.detail || 'Could not subscribe. Please try again.' });
    }

    return res.status(201).json({ message: 'Success! Check your inbox to confirm your subscription.' });

  } catch (error) {
    console.error('Error subscribing to Mailchimp:', error);
    return res.status(500).json({ message: 'An internal error occurred.' });
  }
}
