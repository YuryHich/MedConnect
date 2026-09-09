import { useEffect, useState } from 'react';
import { FORMATS, SPECIALTIES, STATUSES } from '../data/mockConsultations';

const EMPTY_FORM = {
  doctorName: '',
  specialty: SPECIALTIES[0],
  patientName: '',
  date: '',
  startTime: '',
  endTime: '',
  format: 'video',
  status: 'planned',
  price: '',
};

/**
 * Контролируемая форма создания и редактирования консультации: значение каждого
 * поля хранится в состоянии React, а элементы ввода получают его через value.
 */
export function ConsultationForm({ editing, onSubmit, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  // При выборе записи для редактирования форма заполняется её значениями
  useEffect(() => {
    setForm(editing ? { ...editing, price: String(editing.price) } : EMPTY_FORM);
    setError('');
  }, [editing]);

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const required = ['doctorName', 'patientName', 'date', 'startTime', 'endTime'];
    const missing = required.filter((field) => !String(form[field]).trim());
    if (missing.length > 0) {
      setError('Заполните все обязательные поля');
      return;
    }
    if (form.startTime >= form.endTime) {
      setError('Время начала должно быть раньше времени окончания');
      return;
    }

    onSubmit({ ...form, price: Number(form.price) || 0 });
    setForm(EMPTY_FORM);
    setError('');
  };

  // Горячая клавиша: Enter добавляет запись, Escape отменяет редактирование
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && event.target.tagName !== 'BUTTON') {
      handleSubmit(event);
    }
    if (event.key === 'Escape' && editing) {
      onCancel();
    }
  };

  return (
    <form className="card form" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
      <h2>{editing ? `Редактирование записи №${editing.id}` : 'Новая консультация'}</h2>

      <div className="form-grid">
        <label>
          Врач
          <input
            type="text"
            name="doctorName" value={form.doctorName}
            onChange={update('doctorName')}
            placeholder="Фамилия и имя врача"
          />
        </label>

        <label>
          Специализация
          <select name="specialty" value={form.specialty} onChange={update('specialty')}>
            {SPECIALTIES.map((specialty) => (
              <option key={specialty} value={specialty}>{specialty}</option>
            ))}
          </select>
        </label>

        <label>
          Пациент
          <input
            type="text"
            name="patientName" value={form.patientName}
            onChange={update('patientName')}
            placeholder="Фамилия и имя пациента"
          />
        </label>

        <label>
          Дата
          <input type="date" name="date" value={form.date} onChange={update('date')} />
        </label>

        <label>
          Начало
          <input type="time" name="startTime" value={form.startTime} onChange={update('startTime')} />
        </label>

        <label>
          Окончание
          <input type="time" name="endTime" value={form.endTime} onChange={update('endTime')} />
        </label>

        <label>
          Формат
          <select name="format" value={form.format} onChange={update('format')}>
            {FORMATS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>

        <label>
          Статус
          <select name="status" value={form.status} onChange={update('status')}>
            {STATUSES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>

        <label>
          Стоимость, BYN
          <input
            type="number"
            min="0"
            name="price" value={form.price}
            onChange={update('price')}
            placeholder="0"
          />
        </label>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="primary">
          {editing ? 'Сохранить изменения' : 'Добавить консультацию'}
        </button>
        {editing && (
          <button type="button" onClick={onCancel}>
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}
