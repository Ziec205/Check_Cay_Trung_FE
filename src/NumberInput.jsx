import { useLayoutEffect, useRef, useState } from 'react';

// Ô nhập số an toàn với bộ gõ tiếng Việt (Telex, VNI).
// Khi bộ gõ đang soạn chữ (chữ có gạch chân), để nguyên những gì người dùng gõ;
// chỉ lọc chữ số và định dạng khi bộ gõ đã chốt, rồi đặt con trỏ về đúng chỗ.
// Nếu sửa giá trị giữa lúc bộ gõ đang soạn, bộ gõ sẽ chèn lại chữ cũ và làm nhảy số.
export default function NumberInput({ value, onChange, format = (d) => d, maxDigits = 9, ...props }) {
  const ref = useRef(null);
  const composing = useRef(false);
  const caretDigits = useRef(null);
  const [draft, setDraft] = useState(null);
  // Luôn vẽ lại sau mỗi lần gõ, kể cả khi chữ số không đổi (ví dụ xóa dấu phẩy), để đặt lại con trỏ
  const [, rerender] = useState(0);

  const commit = (raw, caret) => {
    const before = raw.slice(0, caret ?? raw.length).replace(/\D/g, '').length;
    const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, maxDigits);
    caretDigits.current = Math.min(before, digits.length);
    setDraft(null);
    rerender((n) => n + 1);
    onChange(digits);
  };

  // Sau khi định dạng (ví dụ thêm dấu phẩy), đặt con trỏ sau đúng số chữ số đã gõ
  useLayoutEffect(() => {
    const el = ref.current;
    if (caretDigits.current == null || !el || document.activeElement !== el) return;
    let left = caretDigits.current;
    let pos = 0;
    while (pos < el.value.length && left > 0) {
      if (/\d/.test(el.value[pos])) left -= 1;
      pos += 1;
    }
    el.setSelectionRange(pos, pos);
    caretDigits.current = null;
  });

  return (
    <input
      {...props}
      ref={ref}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      value={draft ?? (value ? format(value) : '')}
      onCompositionStart={() => { composing.current = true; }}
      onCompositionEnd={(e) => {
        composing.current = false;
        commit(e.currentTarget.value, e.currentTarget.selectionStart);
      }}
      onChange={(e) => {
        if (composing.current || e.nativeEvent.isComposing) setDraft(e.target.value);
        else commit(e.target.value, e.target.selectionStart);
      }}
    />
  );
}
