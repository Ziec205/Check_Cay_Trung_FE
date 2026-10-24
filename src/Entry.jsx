import { useMemo, useRef, useState } from 'react';
import { api } from './api.js';
import { dateLabel, fmt1, isOdd, parseNumbers, summarize, todayStr } from './calc.js';
import Breakdown from './Breakdown.jsx';
import Weights from './Weights.jsx';

// Thu nhỏ ảnh để tải nhanh và đỡ tốn quota Gemini.
function resizeImage(file, max = 1600) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85).split(',')[1]);
    };
    img.onerror = () => reject(new Error('Không mở được ảnh'));
    img.src = url;
  });
}

export default function Entry({ slip, onSaved, onCancel }) {
  const [date, setDate] = useState(slip?.date || todayStr());
  const [text, setText] = useState(slip ? slip.values.join(' ') : '');
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [raw, setRaw] = useState('');
  const [single, setSingle] = useState('');
  const fileRef = useRef(null);

  // Nhập tay từng số: đủ 3 chữ số thì tự thêm vào danh sách.
  const onSingle = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 3);
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

  const readImage = async (file) => {
    if (!file) return;
    setReading(true);
    setMessage(null);
    try {
      const image = await resizeImage(file);
      const { values: found, raw: answer } = await api.ocr(image, 'image/jpeg');
      setRaw(answer);
      if (found.length === 0) {
        setMessage({ type: 'error', text: 'Không lọc được số nào từ câu trả lời của AI. Hãy chụp rõ hơn hoặc gõ tay.' });
      } else {
        setText((old) => (old.trim() ? `${old.trim()} ${found.join(' ')}` : found.join(' ')));
        setMessage({ type: 'ok', text: `Đã điền ${found.length} số từ ảnh. Đối chiếu với sổ và sửa nếu cần trước khi lưu.` });
      }
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    }
    setReading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      if (slip) await api.updateSlip(slip.id, { date, values });
      else await api.createSlip({ date, values });
      setText('');
      setRaw('');
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

        <div className="field">
          <span className="field-label">Đọc từ ảnh sổ</span>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => readImage(e.target.files?.[0])} />
          <button className="btn" disabled={reading} onClick={() => fileRef.current?.click()}>
            {reading ? 'AI đang đọc ảnh...' : 'Chụp hoặc chọn ảnh'}
          </button>
        </div>

        <label className="field">
          <span className="field-label">Thêm từng số</span>
          <input
            className="single"
            inputMode="numeric"
            maxLength={3}
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
        />
        <span id="text-hint" className="hint">Mỗi số gồm 3 chữ số, cách nhau bằng dấu cách hoặc xuống dòng. 201 nghĩa là 20,1 kg.</span>
      </label>

      <div aria-live="polite">
        {message && <p className={`notice ${message.type}`}>{message.text}</p>}
        {invalid.length > 0 && <p className="notice error">Các số này không đủ 3 chữ số, hãy sửa lại: {invalid.join(', ')}</p>}
      </div>

      {raw && (
        <details className="raw">
          <summary>Xem nguyên văn AI chép từ ảnh</summary>
          <pre>{raw}</pre>
        </details>
      )}

      {values.length > 0 && (
        <section className="sheet preview" aria-labelledby="preview-title">
          <h3 id="preview-title" className="preview-title">
            <span className="tally-count small">{summary.count}</span> cây
            <span className="tally-rem inline">còn {fmt1(summary.remKg)} kg</span>
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
