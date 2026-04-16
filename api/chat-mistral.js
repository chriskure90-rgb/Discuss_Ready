export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const body = await req.json();
    const apiKey = process.env.MISTRAL_API_KEY;

    // 1. Mistral用のメッセージ配列を準備
    let mistralMessages = [];

    // もしシステムプロンプト（AIへのルール）があれば、一番最初のメッセージとして追加
    if (body.system) {
      mistralMessages.push({
        role: "system",
        content: body.system
      });
    }

    // 2. フロントエンドからの会話履歴を追加
    // Mistralは role: 'user' または 'assistant', content: '文字列' というシンプルな形です
    if (body.messages) {
      body.messages.forEach(m => {
        mistralMessages.push({
          role: m.role, 
          content: m.content || " "
        });
      });
    }

    // 3. Mistralへ送るデータを作成
    const payload = {
      model: "mistral-large-latest", // 賢さ重視（早さ重視なら mistral-small-latest もおすすめ！）
      messages: mistralMessages
    };

    const url = 'https://api.mistral.ai/v1/chat/completions';

    // 4. Mistralに通信
    const mistralReq = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}` // MistralはURLの末尾ではなく、ここでキーを渡します
      },
      body: JSON.stringify(payload)
    });

    const data = await mistralReq.json();

    // エラーが返ってきたら理由を表示
    if (data.error) {
      return new Response(JSON.stringify({
        content: [{ text: `Mistral APIエラー: ${data.error.message}` }]
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 5. 成功した場合は返事を取り出す
    const replyText = data.choices?.[0]?.message?.content || "返事が空っぽでした。";

    // 6. フロントエンドへ返す（Geminiの時と同じフォーマットにしてあげるのがコツ！）
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
