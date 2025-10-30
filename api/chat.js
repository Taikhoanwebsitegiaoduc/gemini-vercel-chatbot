// api/chat.js (Backend Logic - Vercel Serverless Function)

import { GoogleGenAI } from "@google/genai";

// 1. Khởi tạo client với API Key
// Code sẽ tự động lấy 1 trong 2 key bạn đã thiết lập (GEMINI_API_KEY hoặc GOOGLE_API_KEY)
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

// 2. Lấy mô hình (model)
// Chúng ta lấy model ở đây một lần để tái sử dụng
const model = genAI.getGenerativeModel({ 
  model: "gemini-pro", // Sử dụng gemini-pro cho ổn định
  safetySettings: [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
  ]
});

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

        // 3. SỬA LỖI: Gọi hàm generateContent từ đối tượng 'model' đã lấy ở trên
        const result = await model.generateContent(prompt);
        const geminiResponse = await result.response;
        const answer = geminiResponse.text(); // Lấy nội dung text từ phản hồi

        if (answer) {
            return response.status(200).json({ answer: answer });
        } else {
            return response.status(500).json({ error: "Lỗi: Gemini API không trả về nội dung hợp lệ." });
        }

    } catch (error) {
        console.error("Gemini API Lỗi (FATAL):", error);

        // Báo lỗi rõ ràng nếu là API Key
        if (error.message.includes("API key not valid")) {
            return response.status(401).json({ error: "Lỗi API Key: Vui lòng kiểm tra lại GEMINI_API_KEY ở Vercel Settings." });
        }

        return response.status(500).json({ 
            error: "Lỗi Serverless Function. Chi tiết đã được ghi vào Vercel Logs.", 
            details: error.message 
        });
    }
}
