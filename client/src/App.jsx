import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from './api';
import { ConsultationForm } from './components/ConsultationForm';
import { ConsultationList } from './components/ConsultationList';
import { LoginForm } from './components/LoginForm';
import { Toast } from './components/Toast';
import { STATUSES } from './data/dictionaries';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import './App.css';

const PAGE_SIZE = 5;

export default function App() {
  // --- сессия ---
  const [user, setUser] = useState(api.getStoredUser);
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  // --- данные с сервера ---
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [doctors, setDoctors] = useState([]);

  // --- асинхронные состояния ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [busyIds, setBusyIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- параметры запроса ---
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Поисковый запрос отправляется только через 400 мс после последнего ввода
  const debouncedSearch = useDebouncedValue(search, 400);
  const isMounted = useRef(true);

  const notify = useCallback((message, kind = 'error') => {
    setToast({ message, kind });
  }, []);

  // Перехватчик axios сообщает об истёкшем токене через событие окна
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setAuthError('Сессия истекла, войдите заново');
    };
    window.addEventListener('medconnect:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('medconnect:unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => () => { isMounted.current = false; }, []);

  // Загрузка справочника врачей после входа. Запрос отменяется при
  // размонтировании компонента с помощью AbortController.
  useEffect(() => {
    if (!user) return undefined;

    const controller = new AbortController();
    api.fetchDoctors(controller.signal)
      .then((data) => setDoctors(data.items))
      .catch((err) => {
        if (err.name !== 'CanceledError') notify(`Не удалось загрузить врачей: ${err.message}`);
      });
    return () => controller.abort();
  }, [user, notify]);

  // Основная загрузка списка: реагирует на поиск, фильтр, страницу и
  // принудительное обновление. Предыдущий запрос отменяется.
  useEffect(() => {
    if (!user) return undefined;

    const controller = new AbortController();
    setIsLoading(true);
    setError('');

    api.fetchConsultations(
      {
        search: debouncedSearch || undefined,
        status: status || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      },
      controller.signal,
    )
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
      })
      .catch((err) => {
        if (err.name === 'CanceledError' || err.original?.code === 'ERR_CANCELED') return;
        setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [user, debouncedSearch, status, page, reloadToken]);

  // Заголовок страницы отражает количество найденных записей
  useEffect(() => {
    document.title = user
      ? `MedConnect (${total}) — консультации`
      : 'MedConnect — вход';
  }, [total, user]);

  // --- аутентификация ---
  const handleLogin = async (email, password) => {
    setAuthBusy(true);
    setAuthError('');
    try {
      const data = await api.login(email, password);
      api.saveSession(data.token, data.user);
      setUser(data.user);
      setPage(0);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleRegister = async (payload) => {
    setAuthBusy(true);
    setAuthError('');
    try {
      await api.register(payload);
      await handleLogin(payload.email, payload.password);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = () => {
    api.clearSession();
    setUser(null);
    setItems([]);
    setTotal(0);
  };

  // --- оптимистичное добавление ---
  const handleCreate = async (payload) => {
    const tempId = `temp-${Date.now()}`;
    const doctor = doctors.find((item) => item.id === payload.doctorId);

    // 1. Запись сразу появляется в списке с временным идентификатором
    setItems((prev) => [...prev, { ...payload, id: tempId, doctor, optimistic: true }]);
    setTotal((prev) => prev + 1);
    setIsSubmitting(true);

    try {
      // 2. Отправка запроса на сервер
      const created = await api.addConsultation(payload);
      // 3. Успех: временный идентификатор заменяется реальным
      setItems((prev) => prev.map((item) => (item.id === tempId ? created : item)));
      notify(`Консультация №${created.id} создана`, 'success');
    } catch (err) {
      // 4. Ошибка: запись убирается из состояния, показывается уведомление
      setItems((prev) => prev.filter((item) => item.id !== tempId));
      setTotal((prev) => prev - 1);
      notify(`Не удалось создать запись: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- оптимистичное обновление ---
  const handleUpdate = async (payload) => {
    const id = editing.id;
    const snapshot = items;
    const doctor = doctors.find((item) => item.id === payload.doctorId);

    setItems((prev) => prev.map((item) => (
      item.id === id ? { ...item, ...payload, doctor } : item
    )));
    setEditing(null);
    setBusyIds((prev) => [...prev, id]);

    try {
      const updated = await api.updateConsultation(id, payload);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      notify(`Консультация №${id} обновлена`, 'success');
    } catch (err) {
      // откат изменения к предыдущему состоянию списка
      setItems(snapshot);
      notify(`Не удалось обновить запись: ${err.message}`);
    } finally {
      setBusyIds((prev) => prev.filter((busy) => busy !== id));
    }
  };

  // --- оптимистичное удаление ---
  const handleDelete = async (item) => {
    const snapshot = items;
    setItems((prev) => prev.filter((row) => row.id !== item.id));
    setTotal((prev) => prev - 1);

    try {
      await api.deleteConsultation(item.id);
      notify(`Консультация №${item.id} удалена`, 'success');
      // перезагрузка страницы списка, чтобы подтянуть запись со следующей страницы
      setReloadToken((prev) => prev + 1);
    } catch (err) {
      // при ошибке элемент возвращается в список
      setItems(snapshot);
      setTotal((prev) => prev + 1);
      notify(`Не удалось удалить запись: ${err.message}`);
    }
  };

  if (!user) {
    return (
      <div className="app">
        <header className="header">
          <div>
            <h1>MedConnect</h1>
            <p className="muted">
              Платформа онлайн-консультаций с врачами: чат, видео, оплата
            </p>
          </div>
        </header>
        <LoginForm
          onLogin={handleLogin}
          onRegister={handleRegister}
          error={authError}
          isBusy={authBusy}
        />
      </div>
    );
  }

  const pageCount = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>MedConnect</h1>
          <p className="muted">
            {user.fullName || user.email} · роль: {user.role} ·{' '}
            {user.role === 'patient' ? 'видны только свои записи' : 'видны все записи'}
          </p>
        </div>
        <button type="button" onClick={handleLogout}>Выйти</button>
      </header>

      <ConsultationForm
        editing={editing}
        doctors={doctors}
        onSubmit={editing ? handleUpdate : handleCreate}
        onCancel={() => setEditing(null)}
        isBusy={isSubmitting}
      />

      <div className="card filters">
        <label>
          Поиск на сервере
          <input
            type="search"
            name="search"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(0); }}
            placeholder="Пациент, врач или специализация"
          />
        </label>

        <label>
          Статус
          <select
            name="status"
            value={status}
            onChange={(event) => { setStatus(event.target.value); setPage(0); }}
          >
            <option value="">Любой</option>
            {STATUSES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>

        <button type="button" onClick={() => setReloadToken((prev) => prev + 1)}>
          Обновить
        </button>
      </div>

      {isLoading && (
        <div className="card loading">
          <span className="spinner" />
          <p>Загрузка данных с сервера…</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="card error-box">
          <p className="error">{error}</p>
          <button type="button" className="primary"
            onClick={() => setReloadToken((prev) => prev + 1)}>
            Повторить
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <p className="muted result-count">
            Найдено {total} записей, страница {page + 1} из {pageCount}
          </p>

          <ConsultationList
            items={items}
            onEdit={setEditing}
            onDelete={handleDelete}
            busyIds={busyIds}
          />

          <div className="pagination">
            <button type="button" disabled={page === 0}
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}>
              Назад
            </button>
            <span className="muted">{page + 1} / {pageCount}</span>
            <button type="button" disabled={page + 1 >= pageCount}
              onClick={() => setPage((prev) => prev + 1)}>
              Вперёд
            </button>
          </div>
        </>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <footer className="footer muted">
        Данные загружаются с REST API {import.meta.env.VITE_API_URL || 'http://localhost:3000/api'};
        JWT хранится в localStorage и подставляется перехватчиком axios
      </footer>
    </div>
  );
}
