// api/chat.js (Backend Logic - Sửa lỗi bằng cách gọi HTTP trực tiếp)

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

        // URL gọi API trực tiếp (giống như Apps Script)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

        const payload = {
          contents: [{ parts: [{ text: prompt }] }],
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        };

        // Dùng 'fetch' (Node.js) thay vì thư viện @google/genai
        const apiResponse = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        // Kiểm tra lỗi (ví dụ: API Key sai)
        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error("LỖI API KEY:", errorText);
            if (apiResponse.status === 400) {
                 return response.status(401).json({ error: "Lỗi API Key: Key không hợp lệ. Vui lòng kiểm tra Vercel Settings." });
            }
            throw new Error(`Gemini API error! status: ${apiResponse.status}`);
        }

        const result = await apiResponse.json();

        // Trích xuất câu trả lời
        if (result.candidates && result.candidates.length > 0) {
          const answer = result.candidates[0].content.parts[0].text;
          return response.status(200).json({ answer: answer });
        } else {
          console.error("LỖI PHẢN HỒI GEMINI:", JSON.stringify(result));
          return response.status(500).json({ error: "Lỗi: Gemini API không trả về nội dung.", details: result.promptFeedback?.blockReason || "Không rõ" });
        }

    } catch (error) {
        console.error("LỖI SERVERLESS (fetch):", error);
        return response.status(500).json({ 
            error: "Lỗi Serverless Function. Chi tiết đã được ghi vào Vercel Logs.", 
            details: error.message 
        });
    }
}
