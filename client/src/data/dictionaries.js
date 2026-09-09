// Справочники значений, совпадающие с ограничениями серверных моделей.
export const FORMATS = [
  { value: 'chat', label: 'Чат' },
  { value: 'video', label: 'Видео' },
];

export const STATUSES = [
  { value: 'planned', label: 'Запланирована' },
  { value: 'completed', label: 'Проведена' },
  { value: 'cancelled', label: 'Отменена' },
];

export const formatLabel = (value) =>
  FORMATS.find((item) => item.value === value)?.label ?? value;

export const statusLabel = (value) =>
  STATUSES.find((item) => item.value === value)?.label ?? value;
