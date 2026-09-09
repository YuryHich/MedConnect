import { useEffect, useMemo, useRef, useState } from 'react';
import { ConsultationForm } from './components/ConsultationForm';
import { ConsultationList } from './components/ConsultationList';
import { FilterBar } from './components/FilterBar';
import { Stats } from './components/Stats';
import { mockConsultations } from './data/mockConsultations';
import { useLocalStorage } from './hooks/useLocalStorage';
import './App.css';

const STORAGE_KEY = 'medconnect.consultations';
const AUTOSAVE_DELAY = 500;
const LOADING_DELAY = 1000;

const EMPTY_FILTERS = { search: '', specialty: '', status: '', sort: 'date-asc' };

export default function App() {
  // Основное состояние: список консультаций сохраняется в localStorage
  const [items, setItems] = useLocalStorage(STORAGE_KEY, mockConsultations);

  // Состояние интерфейса
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [editing, setEditing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveState, setSaveState] = useState('saved');

  // Флаг первого рендера: он нужен, чтобы автосохранение не срабатывало
  // сразу после монтирования, когда данные ещё не менялись пользователем
  const isFirstRender = useRef(true);

  // Эффект 1: имитация загрузки данных с сервера при монтировании.
  // Функция очистки отменяет таймер, если компонент размонтирован раньше.
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), LOADING_DELAY);
    return () => clearTimeout(timer);
  }, []);

  // Эффект 2: заголовок страницы отражает количество запланированных консультаций
  useEffect(() => {
    const planned = items.filter((item) => item.status === 'planned').length;
    document.title = planned > 0
      ? `MedConnect (${planned}) — консультации`
      : 'MedConnect — консультации';
  }, [items]);

  // Эффект 3: индикатор автосохранения с задержкой (debounce).
  // Сам список пишется в localStorage внутри useLocalStorage, здесь
  // отображается состояние сохранения через 500 мс после последнего изменения.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return undefined;
    }

    setSaveState('saving');
    const timer = setTimeout(() => setSaveState('saved'), AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
  }, [items]);

  // Производные данные: фильтрация и сортировка выполняются при изменении
  // списка или условий фильтра
  const visibleItems = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    const filtered = items.filter((item) => {
      const matchesQuery = !query
        || item.doctorName.toLowerCase().includes(query)
        || item.patientName.toLowerCase().includes(query);
      const matchesSpecialty = !filters.specialty || item.specialty === filters.specialty;
      const matchesStatus = !filters.status || item.status === filters.status;
      return matchesQuery && matchesSpecialty && matchesStatus;
    });

    const sorted = [...filtered];
    switch (filters.sort) {
      case 'date-desc':
        sorted.sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`));
        break;
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'doctor':
        sorted.sort((a, b) => a.doctorName.localeCompare(b.doctorName, 'ru'));
        break;
      default:
        sorted.sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
    }
    return sorted;
  }, [items, filters]);

  const stats = useMemo(() => ({
    total: items.length,
    planned: items.filter((item) => item.status === 'planned').length,
    completed: items.filter((item) => item.status === 'completed').length,
    cancelled: items.filter((item) => item.status === 'cancelled').length,
    revenue: items
      .filter((item) => item.status === 'completed')
      .reduce((sum, item) => sum + Number(item.price), 0),
  }), [items]);

  // Создание и обновление записи
  const handleSubmit = (data) => {
    if (editing) {
      // Обновление состояния на основе предыдущего значения
      setItems((prev) => prev.map((item) => (
        item.id === editing.id ? { ...data, id: editing.id } : item
      )));
      setEditing(null);
      return;
    }
    setItems((prev) => [...prev, { ...data, id: Date.now() }]);
  };

  const handleDelete = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (editing?.id === id) setEditing(null);
  };

  const handleToggleStatus = (id) => {
    setItems((prev) => prev.map((item) => (
      item.id === id
        ? { ...item, status: item.status === 'completed' ? 'planned' : 'completed' }
        : item
    )));
  };

  const handleResetAll = () => {
    setItems(mockConsultations);
    setFilters(EMPTY_FILTERS);
    setEditing(null);
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>MedConnect</h1>
          <p className="muted">Платформа онлайн-консультаций с врачами: чат, видео, оплата</p>
        </div>
        <button type="button" onClick={handleResetAll}>Восстановить демо-данные</button>
      </header>

      {isLoading ? (
        <div className="card loading">
          <span className="spinner" />
          <p>Загрузка списка консультаций…</p>
        </div>
      ) : (
        <>
          <Stats stats={stats} saveState={saveState} />

          <ConsultationForm
            editing={editing}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
          />

          <FilterBar
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(EMPTY_FILTERS)}
          />

          <p className="muted result-count">
            Показано {visibleItems.length} из {items.length} записей
          </p>

          <ConsultationList
            items={visibleItems}
            onEdit={setEditing}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        </>
      )}

      <footer className="footer muted">
        Данные сохраняются в localStorage браузера под ключом {STORAGE_KEY}
      </footer>
    </div>
  );
}
