export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const body = await req.json();

    // 1. フロントエンドから送られてきたメッセージを取り出す
    const messages = body.messages || [];
    const lastMessage = messages.length > 0 ? messages[messages.length - 1].content : "こんにちは";

    // 2. Gemini APIの設定
    const apiKey = process.env.GEMINI_API_KEY; // Vercelに預ける鍵の名前
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // 3. Geminiへ通信
    const geminiReq = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: lastMessage }] }]
      })
    });

    const data = await geminiReq.json();

    // 4. Geminiからの返事を取り出す
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "エラーが発生しました。";

    // 5. 元のClaudeの形式に少し似せてフロントエンドへ返す
    return new Response(JSON.stringify({
      content: [{ text: replyText }]
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
