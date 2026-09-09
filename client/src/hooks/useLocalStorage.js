import { useEffect, useState } from 'react';

/**
 * Пользовательский хук для хранения состояния в localStorage.
 *
 * Начальное значение читается «лениво»: функция-инициализатор передаётся в
 * useState, поэтому обращение к localStorage происходит только при первом
 * рендере, а не на каждом последующем.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      // Обработка случая, когда данных в localStorage ещё нет
      return raw === null ? initialValue : JSON.parse(raw);
    } catch (error) {
      console.warn(`Не удалось прочитать ключ "${key}" из localStorage:`, error);
      return initialValue;
    }
  });

  // Побочный эффект: сохранение значения при каждом его изменении
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Не удалось записать ключ "${key}" в localStorage:`, error);
    }
  }, [key, value]);

  return [value, setValue];
}
