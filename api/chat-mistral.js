export const config = {
  runtime: 'edge',
};
export default async function handler(req) {
  try {
    const body = await req.json();
    const apiKey = process.env.MISTRAL_API_KEY;
    let mistralMessages = [];

    if (body.system) {
      mistralMessages.push({ role: "system", content: body.system });
    }

    if (body.messages) {
      body.messages.forEach(m => {
        const content = (m.content || '').trim();
        if (content) {  // 空メッセージを除外
          mistralMessages.push({ role: m.role, content });
        }
      });
    }

    // 最後が assistant で終わっていたら削除（Mistralがエラーになる）
    while (mistralMessages.length > 0 &&
           mistralMessages[mistralMessages.length - 1].role === 'assistant') {
      mistralMessages.pop();
    }

    const payload = {
      model: "mistral-large-latest",
      messages: mistralMessages,
      max_tokens: 500
    };

    const url = 'https://api.mistral.ai/v1/chat/completions';
    const mistralReq = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await mistralReq.json();

    if (data.error) {
      return new Response(JSON.stringify({
        content: [{ text: `Mistral APIエラー: ${data.error.message}` }]
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    const replyText = data.choices?.[0]?.message?.content || '';
    return new Response(JSON.stringify({
      content: [{ text: replyText }]
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({
      content: [{ text: `エラー: ${error.message}` }]
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
