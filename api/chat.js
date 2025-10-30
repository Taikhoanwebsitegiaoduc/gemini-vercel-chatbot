// api/chat.js (Backend Logic - Sửa lỗi 404 Not Found)

// Lấy API Key (Vercel sẽ tự động dùng 1 trong 2 key bạn đã đặt)
const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

// Hàm xử lý chính cho Serverless Function
export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { keyword } = request.body;
        if (!keyword) {
            return response.status(400).json({ error: 'Vui lòng nhập từ khóa.' });
        }

        const prompt = `Bạn là một trợ lý AI tổng quát, hãy trả lời câu hỏi sau bằng tiếng Việt: "${keyword}".`;

        // *** SỬA LỖI 404: Đổi mô hình thành 'gemini-1.0-pro' (bản ổn định) ***
        // Chúng ta dùng tên 'gemini-1.0-pro' vì 'gemini-pro' không còn được hỗ trợ
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${API_KEY}`;

        const payload = {
          contents: [{ parts: [{ text: prompt }] }],
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        };

        // Dùng 'fetch' (Node.js)
        const apiResponse = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        // Kiểm tra lỗi (ví dụ: API Key sai 400 hoặc URL sai 404)
        if (!apiResponse.ok) {
            const errorBody = await apiResponse.json(); // Lấy nội dung lỗi từ Google
            console.error("LỖI GOOGLE API:", JSON.stringify(errorBody));
            throw new Error(`Lỗi Google API: ${apiResponse.status} - ${errorBody.error.message}`);
        }

        const result = await apiResponse.json();

        // Trích xuất câu trả lời
        if (result.candidates && result.candidates.length > 0) {
          const answer = result.candidates[0].content.parts[0].text;
          return response.status(200).json({ answer: answer });
        } else {
          // Lỗi này xảy ra nếu nội dung bị chặn (Safety Settings)
          console.error("LỖI PHẢN HỒI GEMINI (Bị chặn?):", JSON.stringify(result));
          return response.status(500).json({ error: "Lỗi: Gemini API không trả về nội dung.", details: result.promptFeedback?.blockReason || "Nội dung bị chặn" });
        }

    } catch (error) {
        console.error("LỖI SERVERLESS (fetch):", error);
        return response.status(500).json({ 
            error: "Lỗi Serverless Function. Chi tiết đã được ghi vào Vercel Logs.", 
            details: error.message 
        });
    }
}
