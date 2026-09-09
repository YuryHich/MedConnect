import { SPECIALTIES, STATUSES } from '../data/mockConsultations';

/**
 * Панель фильтрации и сортировки. Собственного состояния не имеет: значения и
 * обработчики приходят от родительского компонента (подъём состояния).
 */
export function FilterBar({ filters, onChange, onReset }) {
  const update = (field) => (event) => {
    onChange({ ...filters, [field]: event.target.value });
  };

  return (
    <div className="card filters">
      <label>
        Поиск
        <input
          type="search"
          name="search"
          value={filters.search}
          onChange={update('search')}
          placeholder="Врач или пациент"
        />
      </label>

      <label>
        Специализация
        <select name="specialty" value={filters.specialty} onChange={update('specialty')}>
          <option value="">Все</option>
          {SPECIALTIES.map((specialty) => (
            <option key={specialty} value={specialty}>{specialty}</option>
          ))}
        </select>
      </label>

      <label>
        Статус
        <select name="status" value={filters.status} onChange={update('status')}>
          <option value="">Любой</option>
          {STATUSES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </label>

      <label>
        Сортировка
        <select name="sort" value={filters.sort} onChange={update('sort')}>
          <option value="date-asc">По дате (сначала ранние)</option>
          <option value="date-desc">По дате (сначала поздние)</option>
          <option value="price-asc">По стоимости (возрастание)</option>
          <option value="price-desc">По стоимости (убывание)</option>
          <option value="doctor">По имени врача</option>
        </select>
      </label>

      <button type="button" onClick={onReset}>Сбросить</button>
    </div>
  );
}
