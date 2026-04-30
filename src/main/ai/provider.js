export function createProvider(settings) {
  const baseURL = (settings.endpoint || 'https://api.deepseek.com').replace(/\/+$/, '')
  const model = settings.model || 'deepseek-chat'
  const maxTokens = settings.maxTokens ?? 2048
  const temperature = settings.temperature ?? 0.7

  async function chat(messages, options = {}) {
    const url = `${baseURL}/chat/completions`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false
      }),
      signal: options.signal
    })

    if (!response.ok) {
      const text = await response.text()
      let msg
      try {
        const err = JSON.parse(text)
        msg = err.error?.message || `HTTP ${response.status}`
      } catch {
        msg = `HTTP ${response.status}: ${text.slice(0, 200)}`
      }
      throw new Error(msg)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  }

  async function testConnection() {
    try {
      await chat([{ role: 'user', content: 'Hello' }])
      return { success: true, message: '连接成功' }
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  return { chat, testConnection }
}

export function cleanResponse(text) {
  let result = text.trim()
  const fenceMatch = result.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i)
  if (fenceMatch) {
    result = fenceMatch[1]
  }
  return result.trim()
}
