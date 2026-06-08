export const speak = (text: string): void => {
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  } catch (error) {
    console.error('[Speech] 语音播放失败:', error);
  }
};

export const speakQuestion = (expression: string): void => {
  const formatted = expression
    .replace(/×/g, '乘以')
    .replace(/÷/g, '除以')
    .replace(/\+/g, '加上')
    .replace(/-/g, '减去')
    .replace(/=/g, '等于');
  speak(formatted);
};

export const stopSpeak = (): void => {
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  } catch (error) {
    console.error('[Speech] 停止语音失败:', error);
  }
};
