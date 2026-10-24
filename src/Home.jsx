import { useEffect, useState } from 'react';
import { api } from './api.js';
import { fmt0, fmt1, monthLabel } from './calc.js';
import Breakdown from './Breakdown.jsx';

export default function Home({ refreshKey, onOpenMonth, onNewEntry }) {
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
    if (!window.confirm(`Xóa vĩnh viễn số liệu ${list}?\n\nHãy chắc là bạn đã xuất Excel các tháng này.`)) return;
    setBusy(true);
    try {
      for (const m of data.overflow) await api.deleteMonth(m);
      load();
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  if (error) {
    return (
      <div className="notice error" role="alert">
        <p>Không tải được số liệu: {error}</p>
        <button className="btn" onClick={load}>Tải lại</button>
      </div>
    );
  }
  if (!data) {
    return <p className="loading">Đang tải số liệu. Lần mở đầu có thể mất khoảng một phút vì máy chủ miễn phí cần khởi động.</p>;
  }

  const [current, ...older] = data.months.slice(0, data.max);

  if (!current) {
    return (
      <section className="sheet paper margin empty">
        <h2>Chưa có số liệu</h2>
        <p>Chụp ảnh trang sổ hoặc gõ các số cân để bắt đầu tháng đầu tiên.</p>
        <button className="btn primary" onClick={onNewEntry}>Nhập số liệu</button>
      </section>
    );
  }

  return (
    <>
      {data.overflow.length > 0 && (
        <div className="notice warn" role="status">
          <p>
            Sổ chỉ giữ {data.max} tháng gần nhất. Hãy xuất Excel {data.overflow.map(monthLabel).join(', ')} rồi xóa để giải phóng chỗ.
          </p>
          <div className="actions">
            {data.overflow.map((m) => (
              <a key={m} className="btn" href={api.exportUrl(m)}>Xuất Excel {monthLabel(m)}</a>
            ))}
            <button className="btn danger" disabled={busy} onClick={removeOverflow}>
              {busy ? 'Đang xóa...' : 'Xóa tháng cũ'}
            </button>
          </div>
        </div>
      )}

      <section className="sheet paper margin current" aria-labelledby="current-month">
        <h2 id="current-month" className="sheet-title">{monthLabel(current.month)}</h2>
        <p className="tally">
          <span className="tally-count">{current.count}</span>
          <span className="tally-unit">cây</span>
        </p>
        <p className="tally-rem">còn {fmt1(current.remKg)} kg</p>

        <dl className="facts">
          <div><dt>Tổng cân</dt><dd>{fmt1(current.totalKg)} kg</dd></div>
          <div><dt>Kg nguyên</dt><dd>{fmt0(current.wholeKg)} kg</dd></div>
          <div><dt>Số lần nhập</dt><dd>{current.slipCount}</dd></div>
        </dl>

        <Breakdown s={current} />

        <div className="actions">
          <button className="btn" onClick={() => onOpenMonth(current.month)}>Xem các lần nhập</button>
          <a className="btn" href={api.exportUrl(current.month)}>Xuất Excel tháng này</a>
        </div>
      </section>

      <section className="ledger" aria-labelledby="older-months">
        <div className="section-head">
          <h2 id="older-months">Các tháng trước</h2>
          <a className="btn quiet" href={api.exportUrl()}>Xuất Excel tất cả</a>
        </div>

        {older.length === 0 ? (
          <p className="muted">Các tháng cũ sẽ hiện ở đây, sổ giữ tối đa {data.max} tháng.</p>
        ) : (
          <div className="ledger-rows">
            <div className="ledger-row ledger-head" aria-hidden="true">
              <span>Tháng</span><span className="num">Số cây</span><span className="num">Còn dư</span><span className="num">Tổng cân</span>
            </div>
            {older.map((m) => (
              <details key={m.month} className="ledger-item">
                <summary className="ledger-row">
                  <span className="ledger-month">{monthLabel(m.month)}</span>
                  <span className="num">{m.count} cây</span>
                  <span className="num rem">{fmt1(m.remKg)} kg</span>
                  <span className="num">{fmt1(m.totalKg)} kg</span>
                </summary>
                <div className="ledger-body">
                  <Breakdown s={m} />
                  <div className="actions">
                    <button className="btn" onClick={() => onOpenMonth(m.month)}>Xem các lần nhập</button>
                    <a className="btn" href={api.exportUrl(m.month)}>Xuất Excel</a>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
