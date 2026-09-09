import { useState } from 'react';

const DEMO_ACCOUNTS = [
  { role: 'Пациент', email: 'patient@medconnect.by', password: 'Patient123!' },
  { role: 'Врач', email: 'doctor@medconnect.by', password: 'Doctor123!' },
  { role: 'Администратор', email: 'admin@medconnect.by', password: 'Admin123!' },
];

/**
 * Форма входа и регистрации. Полученный JWT сохраняется вызывающим компонентом
 * в localStorage и затем автоматически подставляется перехватчиком axios.
 */
export function LoginForm({ onLogin, onRegister, error, isBusy }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (mode === 'login') {
      onLogin(form.email, form.password);
    } else {
      onRegister({ email: form.email, password: form.password, fullName: form.fullName });
    }
  };

  return (
    <div className="auth">
      <form className="card auth-form" onSubmit={handleSubmit}>
        <h2>{mode === 'login' ? 'Вход в MedConnect' : 'Регистрация пациента'}</h2>

        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={update('email')}
            placeholder="patient@medconnect.by"
            required
          />
        </label>

        {mode === 'register' && (
          <label>
            Имя и фамилия
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={update('fullName')}
              placeholder="Ольга Климова"
            />
          </label>
        )}

        <label>
          Пароль
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={update('password')}
            placeholder="Не короче 6 символов"
            required
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" className="primary" disabled={isBusy}>
          {isBusy ? 'Отправка…' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
        </button>

        <button
          type="button"
          className="link"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </form>

      <div className="card auth-demo">
        <h3>Демонстрационные учётные записи</h3>
        <table>
          <thead>
            <tr><th>Роль</th><th>Email</th><th>Пароль</th></tr>
          </thead>
          <tbody>
            {DEMO_ACCOUNTS.map((account) => (
              <tr key={account.email}>
                <td>{account.role}</td>
                <td>{account.email}</td>
                <td>{account.password}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted">
          Пациент видит только свои консультации, врач и администратор — все записи.
        </p>
      </div>
    </div>
  );
}
