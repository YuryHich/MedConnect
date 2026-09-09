// Начальные данные, которые используются при первом запуске приложения,
// когда в localStorage ещё нет сохранённого списка консультаций.
export const SPECIALTIES = [
  'Кардиолог',
  'Терапевт',
  'Дерматолог',
  'Невролог',
  'Эндокринолог',
];

export const FORMATS = [
  { value: 'chat', label: 'Чат' },
  { value: 'video', label: 'Видео' },
];

export const STATUSES = [
  { value: 'planned', label: 'Запланирована' },
  { value: 'completed', label: 'Проведена' },
  { value: 'cancelled', label: 'Отменена' },
];

export const mockConsultations = [
  {
    id: 1,
    doctorName: 'Анна Ковалевская',
    specialty: 'Кардиолог',
    patientName: 'Иван Петров',
    date: '2026-09-10',
    startTime: '09:00',
    endTime: '09:30',
    format: 'video',
    status: 'planned',
    price: 45,
  },
  {
    id: 2,
    doctorName: 'Сергей Дубовик',
    specialty: 'Терапевт',
    patientName: 'Мария Сидорова',
    date: '2026-09-10',
    startTime: '11:00',
    endTime: '11:20',
    format: 'chat',
    status: 'planned',
    price: 25,
  },
  {
    id: 3,
    doctorName: 'Ольга Радевич',
    specialty: 'Дерматолог',
    patientName: 'Алексей Морозов',
    date: '2026-09-11',
    startTime: '14:00',
    endTime: '14:45',
    format: 'video',
    status: 'completed',
    price: 60,
  },
];
