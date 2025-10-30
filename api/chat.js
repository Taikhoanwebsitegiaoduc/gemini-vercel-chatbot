// api/chat.js (Backend Logic - Vercel Serverless Function)

// Sửa lỗi cú pháp gọi API
import { GoogleGenAI } from "@google/genai";

// Khởi tạo đối tượng client
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

        const prompt = `Bạn là một trợ lý AI tổng quát, hãy trả lời câu hỏi sau bằng tiếng Việt: "${keyword}".`;

        // *** SỬA LỖI CUỐI CÙNG: Gọi phương thức generateContent của đối tượng 'ai' ***
        // Trong các phiên bản thư viện mới nhất, cú pháp gọi đã được đơn giản hóa
        const geminiResponse = await ai.generateContent({ 
            model: "gemini-pro", 
            contents: [prompt], // Cú pháp contents: [prompt] được đơn giản hóa
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
        });

        const answer = geminiResponse.text;

        if (answer) {
            return response.status(200).json({ answer: answer });
        } else {
            return response.status(500).json({ error: "Lỗi: Gemini API không trả về nội dung hợp lệ." });
        }

    } catch (error) {
        console.error("Gemini API Lỗi (FATAL):", error);
        if (error.message.includes("API key not valid")) {
            return response.status(401).json({ error: "Lỗi API Key: Vui lòng kiểm tra lại GEMINI_API_KEY ở Vercel Settings." });
        }
        if (error.message.includes("400")) {
             return response.status(400).json({ error: "Lỗi API 400: Yêu cầu không hợp lệ. Có thể do Prompt/Model." });
        }

        return response.status(500).json({ 
            error: "Lỗi Serverless Function. Chi tiết đã được ghi vào Vercel Logs.", 
            details: error.message 
        });
    }
}
