// api/chat.js

// Impor fetch jika diperlukan (Node.js < 18). Di Vercel biasanya sudah tersedia.
// const fetch = require('node-fetch');

export default async function handler(req, res) {
    // 1. Hanya izinkan metode POST
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    // 2. Ambil API Key dari Environment Variables Vercel (AMAN!)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY environment variable not set on Vercel.");
        return res.status(500).json({ error: "Server configuration error: API key missing." });
    }

    try {
        // 3. Ambil data (prompt, history, model) dari body request frontend
        // Pastikan frontend mengirimkan 'model' yang valid
        const { prompt, history, model } = req.body;

        if (!prompt || !Array.isArray(history) || !model) {
             console.error("Bad Request: Missing or invalid fields", { prompt, history, model });
             return res.status(400).json({ error: "Missing or invalid required fields: prompt (string), history (array), model (string)" });
        }

        // 4. Siapkan endpoint dan payload untuk Google Gemini API
        // Gunakan model yang dikirim dari frontend
        const googleApiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const payload = {
            contents: [
                ...history, // Sertakan histori sebelumnya
                {
                    role: "user",
                    parts: [{ text: prompt }]
                }
            ],
            // Tambahkan generationConfig atau safetySettings jika perlu dari frontend atau hardcode di sini
            // generationConfig: { temperature: 0.7, ... },
            // safetySettings: [ ... ],
        };

        console.log(`[${new Date().toISOString()}] Forwarding to Google API: ${googleApiEndpoint} for model ${model}`); // Log sisi server (aman)

        // 5. Panggil Google Gemini API dari sisi server
        const googleApiResponse = await fetch(googleApiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            // Tambahkan timeout jika perlu
            // signal: AbortSignal.timeout(30000) // 30 detik timeout
        });

        // 6. Tangani respons dari Google API
        const responseData = await googleApiResponse.json();

        if (!googleApiResponse.ok) {
            console.error(`[${new Date().toISOString()}] Google API Error (${googleApiResponse.status}):`, responseData);
            // Teruskan status error dan pesan dari Google API jika memungkinkan
            return res.status(googleApiResponse.status).json({
                error: `Google API Error: ${responseData?.error?.message || googleApiResponse.statusText}`
            });
        }

        console.log(`[${new Date().toISOString()}] Google API Success Response received for model ${model}.`); // Log sisi server

        // 7. Ekstrak teks (atau handle error/blokir)
         let responseText = null;
         let apiError = null;

         // Cek kandidat pertama
         const candidate = responseData.candidates?.[0];

         if (candidate?.content?.parts?.[0]?.text) {
             responseText = candidate.content.parts[0].text;
         } else if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
             // Handle kasus finish reason selain STOP (misal: SAFETY, RECITATION, MAX_TOKENS)
             console.warn(`[${new Date().toISOString()}] Google API Finish Reason: ${candidate.finishReason}`, candidate.safetyRatings);
             apiError = `Response stopped due to: ${candidate.finishReason}.`;
             if (candidate.finishReason === 'SAFETY' && candidate.safetyRatings) {
                 apiError += ` Details: ${candidate.safetyRatings.map(r => `${r.category} (${r.probability})`).join(', ')}`;
             }
         } else if (responseData.promptFeedback?.blockReason) {
             // Handle jika prompt awal diblokir
             console.warn(`[${new Date().toISOString()}] Google API Prompt Blocked: ${responseData.promptFeedback.blockReason}`, responseData.promptFeedback.safetyRatings);
             apiError = `Request blocked due to: ${responseData.promptFeedback.blockReason}.`;
              if (responseData.promptFeedback.safetyRatings) {
                 apiError += ` Details: ${responseData.promptFeedback.safetyRatings.map(r => `${r.category} (${r.probability})`).join(', ')}`;
             }
         }
         else {
             // Jika struktur respons tidak sesuai harapan
             console.error(`[${new Date().toISOString()}] Unexpected Google API response structure:`, responseData);
             apiError = "Could not extract valid text from Google API response.";
         }

        // 8. Kirim hasil (atau error) kembali ke frontend
        if (apiError) {
             // Kirim error yang terstruktur
             return res.status(500).json({ error: apiError });
        } else {
             // Kirim teks hasil generate
             return res.status(200).json({ text: responseText });
        }

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error in serverless function:`, error);
        // Handle fetch timeout atau network error lainnya
        if (error.name === 'TimeoutError') {
             return res.status(504).json({ error: 'Request to Google API timed out.' });
        }
        return res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
}
