import { useEffect } from 'react';

/**
 * Всплывающее уведомление об успехе или ошибке. Скрывается автоматически;
 * таймер отменяется функцией очистки эффекта.
 */
export function Toast({ message, kind = 'error', onClose, timeout = 4000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, timeout);
    return () => clearTimeout(timer);
  }, [message, onClose, timeout]);

  return (
    <div className={`toast toast-${kind}`} role="status">
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Закрыть">×</button>
    </div>
  );
}
