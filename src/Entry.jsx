import { useMemo, useRef, useState } from 'react';
import { api } from './api.js';
import { dateLabel, fmt1, isOdd, parseNumbers, summarize, todayStr } from './calc.js';
import Summary from './Summary.jsx';

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
  const odd = values.filter(isOdd);

  const readImage = async (file) => {
    if (!file) return;
    setReading(true);
    setMessage(null);
    try {
      const image = await resizeImage(file);
      const { values: found, raw: answer } = await api.ocr(image, 'image/jpeg');
      setRaw(answer);
      if (found.length === 0) {
        setMessage({ type: 'error', text: 'Không lọc được số nào từ câu trả lời của AI (xem bên dưới). Hãy chụp rõ hơn hoặc nhập tay.' });
      } else {
        setText((old) => (old.trim() ? `${old.trim()} ${found.join(' ')}` : found.join(' ')));
        setMessage({ type: 'ok', text: `Lọc được ${found.length} số. Hãy đối chiếu với ảnh và sửa nếu cần trước khi lưu.` });
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
      <h2>{slip ? 'Sửa lần nhập' : 'Nhập số liệu'}</h2>

      <label className="field">
        Ngày
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      <div className="field">
        Ảnh sổ (AI đọc số)
        <div className="row">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => readImage(e.target.files?.[0])} />
          <button disabled={reading} onClick={() => fileRef.current?.click()}>
            {reading ? 'AI đang đọc ảnh...' : 'Chụp hoặc chọn ảnh'}
          </button>
        </div>
      </div>

      <label className="field">
        Nhập tay từng số (gõ đủ 3 chữ số là tự thêm)
        <input
          className="single"
          inputMode="numeric"
          maxLength={3}
          placeholder="201"
          value={single}
          onChange={onSingle}
        />
      </label>

      <label className="field">
        Các số (mỗi số 3 chữ số, cách nhau bằng dấu cách hoặc xuống dòng)
        <textarea
          rows={6}
          value={text}
          placeholder="201 206 193 ..."
          onChange={(e) => setText(e.target.value)}
        />
      </label>

      {raw && (
        <details className="raw" open>
          <summary>Câu trả lời của AI (đầy đủ)</summary>
          <pre>{raw}</pre>
        </details>
      )}

      {message && <div className={`notice ${message.type}`}>{message.text}</div>}
      {invalid.length > 0 && <div className="notice error">Sai định dạng (phải đúng 3 chữ số): {invalid.join(', ')}</div>}
      {odd.length > 0 && <div className="notice warn">Số bất thường, hãy kiểm tra lại: {odd.join(', ')}</div>}

      {values.length > 0 && (
        <div className="preview">
          <h3>Xem trước: {summary.count} cây · dư {fmt1(summary.remKg)} kg</h3>
          <Summary s={summary} />
        </div>
      )}

      <div className="row">
        <button className="primary" disabled={!canSave} onClick={save}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
        {onCancel && <button onClick={onCancel}>Hủy</button>}
      </div>
    </div>
  );
}
