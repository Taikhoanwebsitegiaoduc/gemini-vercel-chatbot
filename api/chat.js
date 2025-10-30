// api/chat.js (Backend Logic - Vercel Serverless Function)

// SỬA ĐỔI QUAN TRỌNG: Gọi trực tiếp hàm GenerateContent thay vì dùng 'new GoogleGenAI'
import { GoogleGenAI } from "@google/genai";

// Lấy API Key từ biến môi trường (Environment Variable)
// Tên biến GEMINI_API_KEY đã được Vercel tự động nhận
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

        // *** SỬA LỖI: Gọi phương thức generateContent của đối tượng 'ai.models' ***
        const geminiResponse = await ai.models.generateContent({ 
            model: "gemini-pro", // Dùng mô hình pro để có kết quả chất lượng hơn
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
        // THÔNG BÁO LỖI RÕ HƠN NẾU KEY BỊ LỖI
        if (error.message.includes("API key not valid")) {
            return response.status(401).json({ error: "Lỗi API Key: Vui lòng kiểm tra lại GEMINI_API_KEY." });
        }

        return response.status(500).json({ 
            error: "Lỗi Serverless Function. Vui lòng kiểm tra log Vercel.", 
            details: error.message 
        });
    }
}
