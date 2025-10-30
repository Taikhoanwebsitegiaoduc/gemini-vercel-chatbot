// api/chat.js (Backend Logic - Vercel Serverless Function)

import { GoogleGenAI } from "@google/genai";

// Lấy API Key từ biến môi trường (Environment Variable)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Hàm xử lý chính cho Serverless Function
export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { keyword } = request.body; // Nhận keyword từ Frontend

        if (!keyword) {
            return response.status(400).json({ error: 'Vui lòng nhập từ khóa.' });
        }
        
        // Tạo prompt (bạn có thể thay đổi prompt này)
        const prompt = `Bạn là một trợ lý AI tổng quát, hãy trả lời câu hỏi sau bằng tiếng Việt: "${keyword}".`;

        const geminiResponse = await ai.generateContent({
            model: "gemini-pro", // Bạn có thể dùng gemini-pro hoặc gemini-2.5-flash
            contents: [{ parts: [{ text: prompt }] }],
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
        });

        // Đảm bảo có phản hồi hợp lệ
        if (geminiResponse.candidates && geminiResponse.candidates.length > 0) {
            const answer = geminiResponse.candidates[0].content.parts[0].text;
            return response.status(200).json({ answer: answer });
        } else {
            return response.status(500).json({ error: "Lỗi: Gemini API không trả về nội dung." });
        }

    } catch (error) {
        console.error("Gemini API Error:", error);
        return response.status(500).json({ 
            error: "Lỗi Serverless Function. Vui lòng kiểm tra log Vercel.", 
            details: error.message 
        });
    }
}
