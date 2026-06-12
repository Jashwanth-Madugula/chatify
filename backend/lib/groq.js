import Groq from "groq-sdk";

export const getAiResponse = async (userPrompt, requestingUser) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("GROQ_API_KEY is not set in backend .env");
    return "I'm sorry, my AI features are currently misconfigured. Please check the server's API key.";
  }

  // Remove the "@ai" prefix if present
  const cleanedPrompt = userPrompt.replace(/^@ai\s+/i, "").trim();

  const systemMessage = `You are TripleS AI, a friendly, highly intelligent, and helpful AI assistant inside the TripleS Chat application.
You are currently responding to a user named ${requestingUser.fullName || "Friend"} (Bio: ${requestingUser.bio || "None"}).
Please keep your answers concise, engaging, and tailored to this user. Use formatting like bullet points or bold text if helpful, but keep responses relatively short so they fit nicely in a chat screen.`;

  try {
    const groq = new Groq({ apiKey });
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: cleanedPrompt }
      ],
      model: "llama-3.3-70b-versatile",
    });

    return chatCompletion.choices[0]?.message?.content || "I couldn't generate a response.";
  } catch (err) {
    console.error("Error communicating with Groq API:", err);
    return "I'm having trouble connecting to my AI brain right now. Please try again later.";
  }
};
