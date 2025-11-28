import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendMessage } from '../api/aiService';

// Mock verileri
const MOCK_CHUNKS = [
  'data: {"choices":[{"delta":{"content":"Mer"}}]}\n\n',
  'data: {"choices":[{"delta":{"content":"haba"}}]}\n\n',
  'data: [DONE]\n\n'
];

describe('aiService', () => {
  beforeEach(() => {
    // Her test öncesi fetch mockunu temizle
    vi.restoreAllMocks();
  });

  // Stream yanıtını simüle eden yardımcı fonksiyon
  const mockStreamResponse = (chunks) => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        chunks.forEach(chunk => controller.enqueue(encoder.encode(chunk)));
        controller.close();
      }
    });
    return {
      ok: true,
      body: stream,
      headers: new Headers(),
    };
  };

  it('API başarılı yanıt verdiğinde stream verilerini doğru işlemeli', async () => {
    // Fetchi başarılı bir stream dönecek şekilde mockla
    global.fetch = vi.fn().mockResolvedValue(mockStreamResponse(MOCK_CHUNKS));

    const onChunk = vi.fn();
    const onEnd = vi.fn();

    await sendMessage(
      [{ role: 'user', content: 'test' }],
      'llama-3-8b',
      onChunk,
      onEnd,
      null
    );

    // Chunkların birleştirilip doğru iletildiğini kontrol et
    expect(onChunk).toHaveBeenCalledTimes(2);
    expect(onChunk).toHaveBeenNthCalledWith(1, 'Mer');
    expect(onChunk).toHaveBeenNthCalledWith(2, 'haba');
    
    // İşlem bitince onEnd çağrıldı mı?
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('API hata döndürdüğünde (örn: 401) hata fırlatmalı', async () => {
    const errorMessage = 'API Key Geçersiz';
    
    // Fetchi hata dönecek şekilde mockla
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: errorMessage } })
    });

    await expect(sendMessage([], 'model', vi.fn(), vi.fn(), null))
      .rejects
      .toThrow(errorMessage);
  });

  it('AbortSignal tetiklendiğinde (kullanıcı iptali) hata fırlatmamalı', async () => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    // Fetci AbortError fırlatacak şekilde mockla
    global.fetch = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'));

    // Konsol logunu spy yap 
    const consoleSpy = vi.spyOn(console, 'log');

    // Fonksiyonun hata fırlatmadığını promise in resolve olduğunu doğrula
    await expect(sendMessage([], 'model', vi.fn(), vi.fn(), signal))
      .resolves
      .toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith('İşlem kullanıcı tarafından durduruldu.');
  });

  it('Fetch parametreleri doğru gönderilmeli', async () => {
    global.fetch = vi.fn().mockResolvedValue(mockStreamResponse([]));
    
    const messages = [{ role: 'user', content: 'hello' }];
    const model = 'mixtral-8x7b';

    await sendMessage(messages, model, vi.fn(), vi.fn(), null);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': expect.stringContaining('Bearer')
        }),
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1024,
          stream: true
        })
      })
    );
  });
});