import { useEffect, useState } from 'react';
import { api } from './api.js';
import { dateLabel, fmt1, monthLabel } from './calc.js';
import Entry from './Entry.jsx';

export default function History({ month, setMonth, refreshKey, onChanged }) {
  const [months, setMonths] = useState([]);
  const [slips, setSlips] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.months().then((d) => {
      const list = d.months.map((m) => m.month);
      setMonths(list);
      if (!month && list.length) setMonth(list[0]);
    }).catch((e) => setError(e.message));
  }, [refreshKey]);

  const loadSlips = () => {
    if (!month) return setSlips([]);
    api.slips(month).then(setSlips).catch((e) => setError(e.message));
  };
  useEffect(loadSlips, [month, refreshKey]);

  const remove = async (s) => {
    if (!window.confirm(`Xóa lần nhập ngày ${dateLabel(s.date)} (${s.count} cây)?`)) return;
    try {
      await api.deleteSlip(s.id);
      onChanged();
    } catch (e) {
      setError(e.message);
    }
  };

  if (editing) {
    return <Entry slip={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); onChanged(); }} />;
  }

  return (
    <>
      <div className="row between">
        <h2>Các lần nhập</h2>
        {months.length > 0 && (
          <select value={month || ''} onChange={(e) => setMonth(e.target.value)}>
            {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        )}
      </div>
      {error && <div className="notice error">{error}</div>}
      {months.length === 0 && !error && <p className="muted">Chưa có số liệu.</p>}
      <ul className="slips">
        {slips.map((s) => (
          <li key={s.id} className="card">
            <div className="row between">
              <b>{dateLabel(s.date)}</b>
              <span>{s.count} cây · dư {fmt1(s.remKg)} kg</span>
            </div>
            <p className="nums">{s.values.join(' ')}</p>
            <div className="row">
              <button onClick={() => setEditing(s)}>Sửa</button>
              <button className="danger" onClick={() => remove(s)}>Xóa</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
