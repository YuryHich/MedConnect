import { formatLabel, statusLabel } from '../data/dictionaries';

/**
 * Отображение списка консультаций, полученного с сервера. Записи с временным
 * идентификатором (оптимистично добавленные) помечаются как отправляемые.
 */
export function ConsultationList({ items, onEdit, onDelete, onOpenChat, busyIds }) {
  if (items.length === 0) {
    return (
      <div className="card empty">
        <p>Консультации не найдены. Измените условия поиска или добавьте новую запись.</p>
      </div>
    );
  }

  return (
    <ul className="list">
      {items.map((item) => {
        const isPending = item.optimistic || busyIds.includes(item.id);
        return (
          <li key={item.id} className={`card item status-${item.status} ${isPending ? 'pending' : ''}`}>
            <div className="item-main">
              <div>
                <h3>{item.doctor?.fullName ?? 'Врач не указан'}</h3>
                <p className="muted">{item.doctor?.specialty}</p>
              </div>
              <div className="item-badges">
                {isPending && <span className="badge pending-badge">отправка…</span>}
                <span className={`badge ${item.status}`}>{statusLabel(item.status)}</span>
              </div>
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
                <dd>{Number(item.price)} BYN</dd>
              </div>
            </dl>

            <div className="item-actions">
              <button type="button" onClick={() => onOpenChat(item)} disabled={isPending}>
                Открыть чат
              </button>
              <button type="button" onClick={() => onEdit(item)} disabled={isPending}>
                Редактировать
              </button>
              <button type="button" className="danger" onClick={() => onDelete(item)}
                disabled={isPending}>
                Удалить
              </button>
              <span className="muted item-id">id: {item.id}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
