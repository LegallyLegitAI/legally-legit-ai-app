
/**
 * Subscribes a user to an email nurture sequence by calling a backend API endpoint.
 * In a real application, this frontend code calls a backend you control,
 * which then communicates with an email marketing service like Mailchimp or ConvertKit.
 * This prevents exposing sensitive API keys on the client-side.
 * @param email The user's email address.
 * @returns A promise that resolves when the subscription is complete.
 */
export const subscribeToNurtureSequence = async (email: string): Promise<{ success: boolean; message?: string }> => {
  console.log(`Sending subscription request for ${email} to the backend...`);

  try {
    // In a real app, this URL would point to your deployed backend function
    // e.g., https://your-app.vercel.app/api/subscribe
    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'An error occurred during subscription.');
    }

    const data = await response.json();
    console.log(`Successfully subscribed ${email}.`);
    return { success: true, message: data.message };
  } catch (error) {
    console.error('Failed to subscribe email:', error);
    // In a production app, you might want to log this error to a monitoring service.
    // For the user, you can return a generic error message.
    return { success: false, message: error instanceof Error ? error.message : 'A network error occurred.' };
  }
};
