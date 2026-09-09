import { FORMATS, STATUSES } from '../data/mockConsultations';

const formatLabel = (value) =>
  FORMATS.find((item) => item.value === value)?.label ?? value;

const statusLabel = (value) =>
  STATUSES.find((item) => item.value === value)?.label ?? value;

/**
 * Отображение отфильтрованного списка консультаций. Компонент не хранит
 * состояние: он получает данные и обработчики через props.
 */
export function ConsultationList({ items, onEdit, onDelete, onToggleStatus }) {
  if (items.length === 0) {
    return (
      <div className="card empty">
        <p>Консультации не найдены. Измените условия фильтра или добавьте новую запись.</p>
      </div>
    );
  }

  return (
    <ul className="list">
      {items.map((item) => (
        <li key={item.id} className={`card item status-${item.status}`}>
          <div className="item-main">
            <div>
              <h3>{item.doctorName}</h3>
              <p className="muted">{item.specialty}</p>
            </div>
            <span className={`badge ${item.status}`}>{statusLabel(item.status)}</span>
          </div>

          <dl className="item-details">
            <div>
              <dt>Пациент</dt>
              <dd>{item.patientName}</dd>
            </div>
            <div>
              <dt>Дата</dt>
              <dd>{item.date}</dd>
            </div>
            <div>
              <dt>Время</dt>
              <dd>{item.startTime} – {item.endTime}</dd>
            </div>
            <div>
              <dt>Формат</dt>
              <dd>{formatLabel(item.format)}</dd>
            </div>
            <div>
              <dt>Стоимость</dt>
              <dd>{item.price} BYN</dd>
            </div>
          </dl>

          <div className="item-actions">
            <button type="button" onClick={() => onToggleStatus(item.id)}>
              {item.status === 'completed' ? 'Вернуть в план' : 'Отметить проведённой'}
            </button>
            <button type="button" onClick={() => onEdit(item)}>Редактировать</button>
            <button type="button" className="danger" onClick={() => onDelete(item.id)}>
              Удалить
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
