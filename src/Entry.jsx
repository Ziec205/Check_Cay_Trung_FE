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
  const fileRef = useRef(null);

  const { values, invalid } = useMemo(() => parseNumbers(text), [text]);
  const summary = useMemo(() => summarize(values), [values]);
  const odd = values.filter(isOdd);

  const readImage = async (file) => {
    if (!file) return;
    setReading(true);
    setMessage(null);
    try {
      const image = await resizeImage(file);
      const { values: found } = await api.ocr(image, 'image/jpeg');
      if (found.length === 0) throw new Error('AI không đọc được số nào, hãy chụp rõ hơn');
      setText((old) => (old.trim() ? `${old.trim()} ${found.join(' ')}` : found.join(' ')));
      setMessage({ type: 'ok', text: `AI đọc được ${found.length} số. Hãy đối chiếu với ảnh và sửa nếu cần trước khi lưu.` });
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
        Các số (mỗi số 3 chữ số, cách nhau bằng dấu cách hoặc xuống dòng)
        <textarea
          rows={6}
          value={text}
          placeholder="201 206 193 ..."
          onChange={(e) => setText(e.target.value)}
        />
      </label>

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
