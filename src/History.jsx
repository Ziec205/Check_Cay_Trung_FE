import { useEffect, useState } from 'react';
import { api } from './api.js';
import { dateLabel, fmt1, monthLabel, weekdayLabel } from './calc.js';
import Entry from './Entry.jsx';
import Weights from './Weights.jsx';

export default function History({ month, setMonth, refreshKey, onChanged }) {
  const [months, setMonths] = useState(null);
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
      <div className="section-head">
        <h2 className="page-title">Các lần nhập</h2>
        {months?.length > 0 && (
          <label className="month-pick">
            <span className="sr-only">Chọn tháng</span>
            <select value={month || ''} onChange={(e) => setMonth(e.target.value)}>
              {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
            </select>
          </label>
        )}
      </div>

      {error && <p className="notice error" role="alert">{error}</p>}
      {months === null && !error && <p className="loading">Đang tải số liệu...</p>}
      {months?.length === 0 && <p className="muted">Chưa có lần nhập nào. Các lần nhập sẽ hiện ở đây sau khi bạn lưu.</p>}

      <ol className="slips">
        {slips.map((s) => (
          <li key={s.id} className="slip">
            <div className="slip-head">
              <h3 className="slip-date">
                {weekdayLabel(s.date)}, {dateLabel(s.date)}
              </h3>
              <p className="slip-tally">
                <strong>{s.count} cây</strong>
                <span className="rem">còn {fmt1(s.remKg)} kg</span>
              </p>
            </div>
            <Weights values={s.values} />
            <div className="actions">
              <button className="btn" onClick={() => setEditing(s)}>Sửa</button>
              <button className="btn quiet danger" onClick={() => remove(s)}>Xóa</button>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
