// api/chat.js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY environment variable not set on Vercel.");
        return res.status(500).json({ error: "Server configuration error: API key missing." });
    }

    try {
        const { prompt, history, model } = req.body;

        if (!prompt || !Array.isArray(history) || !model) {
             console.error("Bad Request: Missing or invalid fields", { prompt, history, model });
             return res.status(400).json({ error: "Missing or invalid required fields: prompt (string), history (array), model (string)" });
        }

        const googleApiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const payload = {
            contents: [
                ...history,
                {
                    role: "user",
                    parts: [{ text: prompt }]
                }
            ],
        };

        console.log(`[${new Date().toISOString()}] Forwarding to Google API: ${googleApiEndpoint} for model ${model}`);

        const googleApiResponse = await fetch(googleApiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            // signal: AbortSignal.timeout(30000) // 30 detik timeout
        });

        const responseData = await googleApiResponse.json();

        if (!googleApiResponse.ok) {
            console.error(`[${new Date().toISOString()}] Google API Error (${googleApiResponse.status}):`, responseData);
            return res.status(googleApiResponse.status).json({
                error: `Google API Error: ${responseData?.error?.message || googleApiResponse.statusText}`
            });
        }

        console.log(`[${new Date().toISOString()}] Google API Success Response received for model ${model}.`);

         let responseText = null;
         let apiError = null;

         const candidate = responseData.candidates?.[0];

         if (candidate?.content?.parts?.[0]?.text) {
             responseText = candidate.content.parts[0].text;
         } else if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
             console.warn(`[${new Date().toISOString()}] Google API Finish Reason: ${candidate.finishReason}`, candidate.safetyRatings);
             apiError = `Response stopped due to: ${candidate.finishReason}.`;
             if (candidate.finishReason === 'SAFETY' && candidate.safetyRatings) {
                 apiError += ` Details: ${candidate.safetyRatings.map(r => `${r.category} (${r.probability})`).join(', ')}`;
             }
         } else if (responseData.promptFeedback?.blockReason) {
             console.warn(`[${new Date().toISOString()}] Google API Prompt Blocked: ${responseData.promptFeedback.blockReason}`, responseData.promptFeedback.safetyRatings);
             apiError = `Request blocked due to: ${responseData.promptFeedback.blockReason}.`;
              if (responseData.promptFeedback.safetyRatings) {
                 apiError += ` Details: ${responseData.promptFeedback.safetyRatings.map(r => `${r.category} (${r.probability})`).join(', ')}`;
             }
         }
         else {
             console.error(`[${new Date().toISOString()}] Unexpected Google API response structure:`, responseData);
             apiError = "Could not extract valid text from Google API response.";
         }

        if (apiError) {
             return res.status(500).json({ error: apiError });
        } else {
             return res.status(200).json({ text: responseText });
        }

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error in serverless function:`, error);
        if (error.name === 'TimeoutError') {
             return res.status(504).json({ error: 'Request to Google API timed out.' });
        }
        return res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
}
