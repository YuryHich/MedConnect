import { useEffect, useState } from 'react';

/**
 * Возвращает значение с задержкой (debounce): обновляется только через delay мс
 * после того, как входное значение перестало меняться.
 *
 * Используется для поля поиска, чтобы не отправлять запрос на сервер при
 * каждом нажатии клавиши.
 */
export function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    // очистка отменяет предыдущий таймер при следующем изменении значения
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
