export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const body = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. フロントエンドのメッセージ履歴をGemini形式に変換
    const messages = body.messages || [];
    const geminiContents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || " " }]
    }));

    // 2. Geminiへ送るデータを作成
    const payload = {
      contents: geminiContents
    };

    if (body.system) {
      payload.system_instruction = {
        parts: [{ text: body.system }]
      };
    }

    // 💡 モデル名を現役最新の「gemini-2.5-flash」に変更しました！
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // 3. Geminiに通信
    const geminiReq = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await geminiReq.json();

    // エラーが返ってきたら理由を表示
    if (data.error) {
      return new Response(JSON.stringify({
        content: [{ text: `Gemini APIエラー: ${data.error.message}` }]
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. 成功した場合は返事を取り出す
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "返事が空っぽでした。";

    // 5. フロントエンドへ返す
    return new Response(JSON.stringify({
      content: [{ text: replyText }]
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      content: [{ text: `Vercelプログラムエラー: ${error.message}` }]
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
