import { useEffect, useState } from 'react';
import { api } from './api.js';
import { fmt1, monthLabel } from './calc.js';
import Summary from './Summary.jsx';

export default function Home({ refreshKey, onOpenMonth }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    setError('');
    api.months().then(setData).catch((e) => setError(e.message));
  };
  useEffect(load, [refreshKey]);

  const removeOverflow = async () => {
    const list = data.overflow.map(monthLabel).join(', ');
    if (!window.confirm(`Đã vượt quá ${data.max} tháng. Xóa vĩnh viễn: ${list}?\n\nHãy chắc là bạn đã xuất Excel các tháng này.`)) return;
    setBusy(true);
    try {
      for (const m of data.overflow) await api.deleteMonth(m);
      load();
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  if (error) return <div className="notice error">{error} <button onClick={load}>Thử lại</button></div>;
  if (!data) return <p className="muted">Đang tải... (lần đầu có thể mất khoảng một phút do máy chủ miễn phí đang thức dậy)</p>;

  return (
    <>
      {data.overflow.length > 0 && (
        <div className="notice warn">
          <p>Đang có {data.months.length} tháng, vượt giới hạn {data.max} tháng. Tháng cũ nhất cần xóa: <b>{data.overflow.map(monthLabel).join(', ')}</b>.</p>
          <div className="row">
            {data.overflow.map((m) => (
              <a key={m} className="btn" href={api.exportUrl(m)}>Xuất Excel {monthLabel(m)}</a>
            ))}
            <button className="danger" disabled={busy} onClick={removeOverflow}>Xóa tháng cũ</button>
          </div>
        </div>
      )}

      <div className="row between">
        <h2>Thống kê theo tháng</h2>
        {data.months.length > 0 && <a className="btn" href={api.exportUrl()}>Xuất Excel tất cả</a>}
      </div>

      {data.months.length === 0 && <p className="muted">Chưa có số liệu. Bấm “Nhập số liệu” để bắt đầu.</p>}

      <div className="cards">
        {data.months.slice(0, data.max).map((m) => (
          <section className="card" key={m.month}>
            <h3>{monthLabel(m.month)}</h3>
            <div className="big">{m.count}<small> cây</small></div>
            <p className="muted">{m.slipCount} lần nhập · tổng {fmt1(m.totalKg)} kg</p>
            <Summary s={m} />
            <div className="row">
              <button onClick={() => onOpenMonth(m.month)}>Xem các lần nhập</button>
              <a className="btn" href={api.exportUrl(m.month)}>Xuất Excel</a>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
