const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const session = require("express-session");

const app = express();
const PORT = 3000;

// List of keywords related to cybersecurity
const cybersecurityKeywords = [
    "strong password", "password guidelines", "password manager", "two-factor authentication",
    "cyberattack steps", "data breach", "how to know if my data is leaked",
    "phishing prevention", "ransomware", "network security", "malware prevention",
    "cyber hygiene", "incident response", "where to contact after cyber attack?", "whom to contact after cyber attack?", "who to contact after cyber attack?"
];

// List of common greeting phrases
const greetingKeywords = [
    "hello", "hi", "hey", "greetings", "good morning", "good evening", "howdy", "what's up","bye","Thank you","Bye","Have a good day!","Thanks","Thanks for helping out"
];

app.use(cors());
app.use(bodyParser.json());
app.use(session({
    secret: "secureChatbotSession",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

app.post("/chat", async (req, res) => {
    try {
        const userMessage = req.body.message.toLowerCase();
        req.session.history = req.session.history || [];
        console.log(userMessage)
        // Check if the message contains greeting or cybersecurity-related keywords
        const isGreeting = greetingKeywords.some(greeting => userMessage.includes(greeting));
        const isCybersecurityRelated = cybersecurityKeywords.some(keyword => userMessage.includes(keyword));
        console.log(isCybersecurityRelated)
        if (isGreeting || isCybersecurityRelated) {
            // Append conversation history to provide context
            const conversationContext = req.session.history.join("\n");
            const fullPrompt = `${conversationContext}\nUser: ${userMessage}\nBot:`;
            
            // Send request to Ollama
            const response = await axios.post("https://ollama-shruti-joshi.koyeb.app/api/generate", {
                model: "ollama",
                prompt: fullPrompt,
            });
            console.log("response")
            const responseData = response.data;
            const responseLines = responseData.split("\n");
            let botMessage = responseLines
                .map(line => {
                    try {
                        return JSON.parse(line).response || "";
                    } catch (error) {
                        return "";
                    }
                })
                .join("")
                .trim();

            // Ensure a fallback response
            if (!botMessage) {
                botMessage = "Sorry, I couldn't generate a response. Try again.";
            }
            console.log(botMessage)
            
            // Update conversation history
            req.session.history.push(`User: ${userMessage}`);
            req.session.history.push(`Bot: ${botMessage}`);

            res.json({ message: botMessage });
        } else {
            res.json({ message: "I can only answer cybersecurity questions or greetings." });
        }
    } catch (error) {
        console.error("Error communicating with Ollama:", error);
        res.status(500).json({ message: "Sorry, I couldn't generate a response. Try again." });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
