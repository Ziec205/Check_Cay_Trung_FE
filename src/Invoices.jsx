import { useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import {
  EGGS_PER_TREE, dateLabel, dateTimeLabel, fmtInt, fmtMoney, monthLabel, nowLocal, weekdayLabel,
} from './calc.js';
import NumberInput from './NumberInput.jsx';

let nextKey = 1;
const newLine = (l = {}) => ({
  key: nextKey++,
  eggType: l.eggType || '',
  trees: l.trees ? String(l.trees) : '',
  price: l.pricePerEgg ? String(l.pricePerEgg) : '',
});

const lineEggs = (l) => Number(l.trees || 0) * EGGS_PER_TREE;
const lineAmount = (l) => lineEggs(l) * Number(l.price || 0);
const lineReady = (l) => l.eggType.trim() && Number(l.trees) > 0 && Number(l.price) > 0;

// Một dòng hóa đơn: loại trứng, số cây, đơn giá
function LineEditor({ line, index, count, eggTypes, onChange, onRemove, autoFocus }) {
  const typeRef = useRef(null);
  useEffect(() => { if (autoFocus) typeRef.current?.focus(); }, [autoFocus]);
  const set = (patch) => onChange({ ...line, ...patch });
  const n = index + 1;

  return (
    <fieldset className="line">
      <legend className="line-legend">
        <span>{count > 1 ? `Loại trứng thứ ${n}` : 'Loại trứng'}</span>
        {count > 1 && (
          <button type="button" className="btn quiet danger line-remove" onClick={onRemove}>
            Bỏ dòng này
          </button>
        )}
      </legend>

      <label className="field">
        <span className="sr-only">Tên loại trứng {n}</span>
        <input
          ref={typeRef}
          className="text-input"
          value={line.eggType}
          onChange={(e) => set({ eggType: e.target.value })}
          placeholder="Ví dụ: Trứng gà ta loại 1"
          list="egg-types"
          autoComplete="off"
          enterKeyHint="next"
          maxLength={60}
        />
      </label>

      <div className="field-pair">
        <label className="field">
          <span className="field-label">Số cây</span>
          <span className="affix">
            <NumberInput
              className="text-input num-input"
              value={line.trees}
              onChange={(trees) => set({ trees })}
              maxDigits={6}
              placeholder="10"
              enterKeyHint="next"
            />
            <span className="affix-unit">cây</span>
          </span>
        </label>

        <label className="field">
          <span className="field-label">Đơn giá mỗi quả</span>
          <span className="affix">
            <NumberInput
              className="text-input num-input"
              value={line.price}
              onChange={(price) => set({ price })}
              format={fmtInt}
              maxDigits={8}
              placeholder="2,300"
              enterKeyHint="done"
            />
            <span className="affix-unit">VND</span>
          </span>
        </label>
      </div>

      <p className="line-sum">
        <span>{fmtInt(line.trees)} cây × {EGGS_PER_TREE} = {fmtInt(lineEggs(line))} quả</span>
        <strong>{fmtMoney(lineAmount(line))}</strong>
      </p>
    </fieldset>
  );
}

function InvoiceForm({ invoice, eggTypes, onSaved, onCancel }) {
  const [customer, setCustomer] = useState(invoice?.customer || '');
  const [lines, setLines] = useState(() => (invoice ? invoice.lines.map(newLine) : [newLine()]));
  const [focusKey, setFocusKey] = useState(null);
  const [issuedAt, setIssuedAt] = useState(invoice?.issuedAt || nowLocal());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const trees = lines.reduce((s, l) => s + Number(l.trees || 0), 0);
  const eggs = lines.reduce((s, l) => s + lineEggs(l), 0);
  const total = lines.reduce((s, l) => s + lineAmount(l), 0);
  const canSave = customer.trim() && issuedAt && lines.every(lineReady) && !saving;

  const addLine = () => {
    const l = newLine();
    setLines((ls) => [...ls, l]);
    setFocusKey(l.key);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError('');
    try {
      const body = {
        customer: customer.trim(),
        issuedAt,
        lines: lines.map((l) => ({ eggType: l.eggType.trim(), trees: Number(l.trees), pricePerEgg: Number(l.price) })),
      };
      const saved = invoice ? await api.updateInvoice(invoice.id, body) : await api.createInvoice(body);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form className="invoice-form" onSubmit={save} noValidate>
      <h2 className="page-title">{invoice ? `Sửa hóa đơn ${invoice.number}` : 'Tính tiền'}</h2>

      <label className="field">
        <span className="field-label">Người nhận</span>
        <input
          className="text-input"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          placeholder="Tên người mua"
          autoComplete="off"
          autoCapitalize="words"
          enterKeyHint="next"
          maxLength={100}
        />
      </label>

      <div className="field">
        <label className="field-label" htmlFor="issued-at">Ngày giờ xuất hóa đơn</label>
        <div className="datetime-row">
          <input
            id="issued-at"
            className="text-input"
            type="datetime-local"
            value={issuedAt}
            onChange={(e) => setIssuedAt(e.target.value)}
          />
          <button type="button" className="btn quiet" onClick={() => setIssuedAt(nowLocal())}>Bây giờ</button>
        </div>
      </div>

      <datalist id="egg-types">
        {eggTypes.map((t) => <option key={t} value={t} />)}
      </datalist>

      <div className="lines">
        {lines.map((l, i) => (
          <LineEditor
            key={l.key}
            line={l}
            index={i}
            count={lines.length}
            eggTypes={eggTypes}
            autoFocus={l.key === focusKey}
            onChange={(nl) => setLines((ls) => ls.map((x) => (x.key === l.key ? nl : x)))}
            onRemove={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
          />
        ))}
        <button type="button" className="btn add-line" onClick={addLine}>+ Thêm loại trứng</button>
      </div>

      <section className="calc" aria-live="polite" aria-label="Thành tiền">
        <p className="calc-line">
          <span>Tổng số cây</span>
          <span>{fmtInt(trees)} cây</span>
        </p>
        <p className="calc-line">
          <span>Tổng số trứng</span>
          <span>{fmtInt(eggs)} quả</span>
        </p>
        <p className="calc-total">{fmtMoney(total)}</p>
      </section>

      {error && <p className="notice error" role="alert">{error}</p>}

      <div className="savebar">
        <button type="submit" className="btn primary" disabled={!canSave}>
          {saving ? 'Đang lưu...' : invoice ? 'Lưu thay đổi' : 'Xuất hóa đơn'}
        </button>
        {onCancel && <button type="button" className="btn quiet" onClick={onCancel}>Hủy</button>}
      </div>
    </form>
  );
}

function Receipt({ inv, onEdit, onNew, onBack, onDelete }) {
  const [date] = inv.issuedAt.split('T');
  return (
    <div className="receipt-page">
      <article className="receipt" aria-labelledby="receipt-title">
        <header className="receipt-head">
          <h2 id="receipt-title">Hóa đơn bán trứng</h2>
          <p className="receipt-no">Số {inv.number}</p>
        </header>

        <dl className="receipt-meta">
          <div><dt>Người nhận</dt><dd>{inv.customer}</dd></div>
          <div><dt>Ngày giờ</dt><dd>{weekdayLabel(date)}, {dateTimeLabel(inv.issuedAt)}</dd></div>
        </dl>

        <ul className="receipt-items">
          {inv.lines.map((l, i) => (
            <li key={i} className="receipt-item">
              <div className="receipt-item-head">
                <span className="receipt-item-name">{l.eggType || 'Trứng'}</span>
                <strong>{fmtMoney(l.amount)}</strong>
              </div>
              <p className="receipt-item-calc">
                {fmtInt(l.trees)} cây × {inv.eggsPerTree} = {fmtInt(l.eggs)} quả × {fmtMoney(l.pricePerEgg)}
              </p>
            </li>
          ))}
        </ul>

        <table className="receipt-lines">
          <tbody>
            <tr><th scope="row">Tổng số cây</th><td>{fmtInt(inv.trees)} cây</td></tr>
            <tr><th scope="row">Tổng số trứng</th><td>{fmtInt(inv.eggs)} quả</td></tr>
          </tbody>
        </table>

        <p className="receipt-total">
          <span>Tổng tiền</span>
          <strong>{fmtMoney(inv.total)}</strong>
        </p>
      </article>

      <div className="actions receipt-actions">
        <button className="btn primary" onClick={() => window.print()}>In hoặc lưu PDF</button>
        <button className="btn" onClick={onEdit}>Sửa hóa đơn</button>
        <button className="btn" onClick={onNew}>Tạo hóa đơn mới</button>
      </div>
      <div className="actions receipt-actions secondary">
        <button className="btn quiet" onClick={onBack}>Về danh sách hóa đơn</button>
        <button className="btn quiet danger" onClick={onDelete}>Xóa hóa đơn</button>
      </div>
    </div>
  );
}

function InvoiceList({ refreshKey, month, setMonth, onOpen }) {
  const [months, setMonths] = useState(null);
  const [list, setList] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.invoiceMonths().then((m) => {
      setMonths(m);
      if (m.length && !m.some((x) => x.month === month)) setMonth(m[0].month);
    }).catch((e) => setError(e.message));
  }, [refreshKey]);

  useEffect(() => {
    if (!month) return;
    api.invoices(month).then(setList).catch((e) => setError(e.message));
  }, [month, refreshKey]);

  const current = months?.find((m) => m.month === month);

  return (
    <section className="invoice-list" aria-labelledby="invoice-list-title">
      <div className="section-head">
        <h2 id="invoice-list-title">Hóa đơn đã xuất</h2>
        {months?.length > 0 && (
          <label>
            <span className="sr-only">Chọn tháng</span>
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              {months.map((m) => <option key={m.month} value={m.month}>{monthLabel(m.month)}</option>)}
            </select>
          </label>
        )}
      </div>

      {error && <p className="notice error" role="alert">{error}</p>}
      {months?.length === 0 && <p className="muted">Chưa có hóa đơn nào. Hóa đơn sẽ được lưu ở đây sau khi bạn bấm Xuất hóa đơn.</p>}

      {current && (
        <p className="month-total">
          {current.count} hóa đơn trong {monthLabel(month).toLowerCase()}, tổng <strong>{fmtMoney(current.total)}</strong>
        </p>
      )}

      <ul className="invoice-rows">
        {list.map((inv) => {
          const types = inv.lines.map((l) => l.eggType).filter(Boolean).join(', ');
          return (
            <li key={inv.id}>
              <button className="invoice-row" onClick={() => onOpen(inv)}>
                <span className="invoice-row-main">
                  <span className="invoice-customer">{inv.customer}</span>
                  <span className="invoice-when">{dateTimeLabel(inv.issuedAt)}, {fmtInt(inv.trees)} cây</span>
                  {types && <span className="invoice-types">{types}</span>}
                </span>
                <span className="invoice-amount">{fmtMoney(inv.total)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function Invoices() {
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [month, setMonth] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [eggTypes, setEggTypes] = useState([]);

  useEffect(() => {
    api.eggTypes().then(setEggTypes).catch(() => {});
  }, [refreshKey]);

  const show = (inv) => {
    setViewing(inv);
    window.scrollTo(0, 0);
  };

  const remove = async () => {
    if (!window.confirm(`Xóa hóa đơn ${viewing.number} của ${viewing.customer} ngày ${dateLabel(viewing.issuedAt.split('T')[0])}?`)) return;
    try {
      await api.deleteInvoice(viewing.id);
      setViewing(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      window.alert(e.message);
    }
  };

  if (viewing) {
    return (
      <Receipt
        inv={viewing}
        onEdit={() => { setEditing(viewing); setViewing(null); }}
        onNew={() => { setEditing(null); setViewing(null); setFormKey((k) => k + 1); }}
        onBack={() => setViewing(null)}
        onDelete={remove}
      />
    );
  }

  return (
    <>
      <InvoiceForm
        key={editing?.id || `new-${formKey}`}
        invoice={editing}
        eggTypes={eggTypes}
        onSaved={(inv) => {
          setEditing(null);
          setFormKey((k) => k + 1);
          setMonth(inv.issuedAt.slice(0, 7));
          setRefreshKey((k) => k + 1);
          show(inv);
        }}
        onCancel={editing ? () => { show(editing); setEditing(null); } : undefined}
      />
      {!editing && <InvoiceList refreshKey={refreshKey} month={month} setMonth={setMonth} onOpen={show} />}
    </>
  );
}
