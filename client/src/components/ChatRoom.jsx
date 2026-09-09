import { useEffect, useRef, useState } from 'react';
import { connectSocket } from '../socket';

/**
 * Комната чата консультации. Соединение Socket.IO устанавливается при монтировании,
 * при размонтировании сокет закрывается. Сообщения и индикатор «печатает»
 * приходят событиями сервера; история подгружается acknowledgement на join.
 */
export function ChatRoom({ consultation, user, onClose }) {
  const [status, setStatus] = useState('connecting');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [typingName, setTypingName] = useState('');
  const [members, setMembers] = useState([]);
  const [videoHint, setVideoHint] = useState(false);
  const socketRef = useRef(null);
  const logRef = useRef(null);
  const typingTimer = useRef(null);

  const consultationId = String(consultation.id);

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    const pushSystem = (payload) => {
      setMessages((prev) => [...prev, {
        _id: `sys-${Date.now()}-${Math.random()}`,
        kind: 'system',
        text: payload.text,
        createdAt: payload.createdAt || new Date().toISOString(),
      }]);
    };

    socket.on('connect', () => {
      setStatus('online');
      setError('');
      socket.emit('join', { consultationId }, (response) => {
        if (!response?.ok) {
          setError(response?.error || 'Не удалось войти в комнату');
          return;
        }
        setMessages(response.history || []);
        setMembers(response.members || []);
      });
    });

    socket.on('connect_error', (err) => {
      setStatus('offline');
      setError(err.message === 'AUTH_REQUIRED'
        ? 'Нет токена для подключения к чату'
        : `Ошибка соединения: ${err.message}`);
    });

    socket.on('disconnect', () => setStatus('offline'));

    socket.on('chat:message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('chat:system', pushSystem);

    socket.on('chat:typing', (payload) => {
      if (payload.userId === String(user.id)) return;
      setTypingName(payload.isTyping ? payload.fullName : '');
    });

    socket.on('chat:members', (list) => setMembers(list || []));

    return () => {
      socket.emit('leave', { consultationId });
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [consultationId, user.id]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, typingName]);

  const emitTyping = (isTyping) => {
    socketRef.current?.emit('chat:typing', { consultationId, isTyping });
  };

  const handleChange = (event) => {
    setText(event.target.value);
    emitTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(false), 800);
  };

  const handleSend = (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || !socketRef.current) return;

    emitTyping(false);
    socketRef.current.emit('chat:message', { consultationId, text: value }, (response) => {
      if (!response?.ok) {
        setError(response?.error || 'Сообщение не отправлено');
      }
    });
    setText('');
  };

  const doctorName = consultation.doctor?.fullName || 'врач';
  const title = `Консультация №${consultation.id} · ${doctorName} · ${consultation.patientName}`;

  return (
    <section className="card chat-room">
      <header className="chat-header">
        <div>
          <h2>Чат консультации</h2>
          <p className="muted">{title}</p>
        </div>
        <div className="chat-header-actions">
          <span className={`chat-status ${status}`}>
            {status === 'online' ? 'онлайн' : status === 'connecting' ? 'подключение…' : 'офлайн'}
          </span>
          <button type="button" onClick={() => setVideoHint(true)}>
            Видеозвонок
          </button>
          <button type="button" onClick={onClose}>Закрыть</button>
        </div>
      </header>

      <p className="muted chat-members">
        В комнате: {members.map((member) => member.fullName).join(', ') || 'загрузка…'}
      </p>

      {error && <p className="error">{error}</p>}

      <div className="chat-log" ref={logRef}>
        {messages.length === 0 && (
          <p className="muted empty">Сообщений пока нет. Напишите первое.</p>
        )}
        {messages.map((message) => {
          if (message.kind === 'system') {
            return (
              <div key={message._id} className="chat-system">{message.text}</div>
            );
          }
          const mine = String(message.senderId) === String(user.id);
          return (
            <div key={message._id} className={`chat-bubble ${mine ? 'mine' : 'theirs'}`}>
              <div className="chat-meta">
                {message.senderName}
                {' · '}
                {message.senderRole}
                {' · '}
                {new Date(message.createdAt).toLocaleTimeString('ru-RU', {
                  hour: '2-digit', minute: '2-digit',
                })}
              </div>
              <div>{message.text}</div>
            </div>
          );
        })}
        {typingName && (
          <div className="chat-typing">{typingName} печатает…</div>
        )}
      </div>

      <form className="chat-compose" onSubmit={handleSend}>
        <input
          name="chatText"
          value={text}
          onChange={handleChange}
          placeholder="Сообщение консультации"
          maxLength={1000}
          autoComplete="off"
        />
        <button type="submit" className="primary" disabled={status !== 'online' || !text.trim()}>
          Отправить
        </button>
      </form>

      {videoHint && (
        <div className="video-hint" role="dialog">
          <p>
            Видеозвонок будет доступен в следующей версии (WebRTC).
            Сейчас консультация проходит в чате комнаты consultation:{consultationId}.
          </p>
          <button type="button" className="primary" onClick={() => setVideoHint(false)}>
            Понятно
          </button>
        </div>
      )}
    </section>
  );
}
