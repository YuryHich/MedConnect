/**
 * Сводная статистика по списку консультаций. Значения вычисляются в
 * родительском компоненте через useMemo и передаются готовыми.
 */
export function Stats({ stats, saveState }) {
  return (
    <div className="card stats">
      <div>
        <span className="stats-value">{stats.total}</span>
        <span className="stats-label">всего записей</span>
      </div>
      <div>
        <span className="stats-value">{stats.planned}</span>
        <span className="stats-label">запланировано</span>
      </div>
      <div>
        <span className="stats-value">{stats.completed}</span>
        <span className="stats-label">проведено</span>
      </div>
      <div>
        <span className="stats-value">{stats.cancelled}</span>
        <span className="stats-label">отменено</span>
      </div>
      <div>
        <span className="stats-value">{stats.revenue} BYN</span>
        <span className="stats-label">сумма проведённых</span>
      </div>
      <div>
        <span className={`stats-value save-${saveState}`}>
          {saveState === 'saving' ? 'сохранение…' : 'сохранено'}
        </span>
        <span className="stats-label">автосохранение</span>
      </div>
    </div>
  );
}
