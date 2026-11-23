import { useMemo, useState } from 'react';
import { api } from './api.js';
import { dateLabel, fmt1, fmtInt, fmtMoney, isOdd, leftoverAmount, parseNumbers, summarize, todayStr } from './calc.js';
import Breakdown from './Breakdown.jsx';
import Weights from './Weights.jsx';
import NumberInput from './NumberInput.jsx';

const PRICE_KEY = 'leftoverPrice';

function loadLastPrice() {
  try { return localStorage.getItem(PRICE_KEY) || ''; } catch { return ''; }
}

function saveLastPrice(v) {
  try {
    if (v) localStorage.setItem(PRICE_KEY, v);
    else localStorage.removeItem(PRICE_KEY);
  } catch { /* trình duyệt chặn lưu thì thôi */ }
}

export default function Entry({ slip, onSaved, onCancel }) {
  const [date, setDate] = useState(slip?.date || todayStr());
  const [text, setText] = useState(slip ? slip.values.join(' ') : '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [single, setSingle] = useState('');
  // Giá trứng dư mỗi kg; lần nhập mới lấy lại giá đã dùng lần trước cho đỡ gõ
  const [leftoverPrice, setLeftoverPrice] = useState(() => (slip ? String(slip.leftoverPrice || '') : loadLastPrice()));

  // Nhập tay từng số: đủ 3 chữ số thì tự thêm vào danh sách.
  const onSingle = (v) => {
    if (v.length === 3) {
      setText((old) => (old.trim() ? `${old.trim()} ${v}` : v));
      setSingle('');
    } else {
      setSingle(v);
    }
  };

  const { values, invalid } = useMemo(() => parseNumbers(text), [text]);
  const summary = useMemo(() => summarize(values), [values]);
  const oddCount = values.filter(isOdd).length;
  const leftoverMoney = leftoverAmount(summary.remKg, Number(leftoverPrice || 0));

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const body = { date, values, leftoverPrice: Number(leftoverPrice || 0) };
      if (slip) await api.updateSlip(slip.id, body);
      else await api.createSlip(body);
      saveLastPrice(leftoverPrice);
      setText('');
      setMessage({ type: 'ok', text: `Đã lưu ${values.length} cây cho ngày ${dateLabel(date)}.` });
      onSaved?.();
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    }
    setSaving(false);
  };

  const canSave = values.length > 0 && invalid.length === 0 && /^\d{4}-\d{2}-\d{2}$/.test(date) && !saving;

  return (
    <div className="entry">
      <h2 className="page-title">{slip ? `Sửa lần nhập ngày ${dateLabel(slip.date)}` : 'Nhập số liệu'}</h2>

      <div className="entry-top">
        <label className="field">
          <span className="field-label">Ngày cân</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <label className="field">
          <span className="field-label">Thêm từng số</span>
          <NumberInput
            className="single"
            maxDigits={3}
            placeholder="201"
            value={single}
            onChange={onSingle}
            aria-describedby="single-hint"
          />
          <span id="single-hint" className="hint">Gõ đủ 3 chữ số là tự thêm vào trang.</span>
        </label>
      </div>

      <label className="field">
        <span className="field-label">Các số cân</span>
        <textarea
          className="notebook paper margin"
          rows={5}
          value={text}
          placeholder="201 206 193"
          onChange={(e) => setText(e.target.value)}
          aria-describedby="text-hint"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <span id="text-hint" className="hint">Mỗi số gồm 3 chữ số, cách nhau bằng dấu cách hoặc xuống dòng. 201 nghĩa là 20,1 kg.</span>
      </label>

      <div className="field leftover-field">
        <label className="field-label" htmlFor="leftover-price">Giá trứng dư mỗi kg</label>
        <span className="affix">
          <NumberInput
            id="leftover-price"
            className="text-input num-input"
            value={leftoverPrice}
            onChange={setLeftoverPrice}
            format={fmtInt}
            maxDigits={9}
            placeholder="30,000"
            aria-describedby="leftover-hint"
          />
          <span className="affix-unit">VND</span>
        </span>
        <span id="leftover-hint" className="hint">
          Phần lẻ sau kg nguyên của mỗi cây, ví dụ 201 là 20 kg, dư 0,1 kg. Bỏ trống nếu chưa tính.
        </span>
        {values.length > 0 && (
          <p className="leftover-calc">
            <span>Dư {fmt1(summary.remKg)} kg × {fmtInt(leftoverPrice || 0)} VND/kg</span>
            <strong>{fmtMoney(leftoverMoney)}</strong>
          </p>
        )}
      </div>

      <div aria-live="polite">
        {message && <p className={`notice ${message.type}`}>{message.text}</p>}
        {invalid.length > 0 && <p className="notice error">Các số này không đủ 3 chữ số, hãy sửa lại: {invalid.join(', ')}</p>}
      </div>

      {values.length > 0 && (
        <section className="sheet preview" aria-labelledby="preview-title">
          <h3 id="preview-title" className="preview-title">
            <span className="tally-count small">{summary.count}</span> cây
            <span className="tally-rem inline">còn {fmt1(summary.remKg)} kg</span>
            {leftoverMoney > 0 && <span className="leftover-money">= {fmtMoney(leftoverMoney)}</span>}
          </h3>
          {oddCount > 0 && (
            <p className="notice warn">Có {oddCount} số nằm ngoài khoảng thường gặp, đã gạch chân để bạn kiểm tra.</p>
          )}
          <Weights values={values} />
          <Breakdown s={summary} />
        </section>
      )}

      <div className="savebar">
        <button className="btn primary" disabled={!canSave} onClick={save}>
          {saving ? 'Đang lưu...' : slip ? 'Lưu thay đổi' : 'Lưu lần nhập'}
        </button>
        {onCancel && <button className="btn quiet" onClick={onCancel}>Hủy</button>}
      </div>
    </div>
  );
}
