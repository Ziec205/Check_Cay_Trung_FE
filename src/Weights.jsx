import { isOdd } from './calc.js';

// Một số cân viết như trên vở: kg nguyên mực xanh, phần dư mực đỏ.
export function Weight({ v }) {
  return (
    <span className={isOdd(v) ? 'w odd' : 'w'} title={isOdd(v) ? 'Số bất thường, hãy kiểm tra lại' : undefined}>
      <span className="w-kg">{Math.floor(v / 10)}</span>
      <span className="w-rem">,{v % 10}</span>
    </span>
  );
}

// Lưới số cân trên nền ô ly.
export default function Weights({ values }) {
  return (
    <ol className="weights paper">
      {values.map((v, i) => (
        <li key={i}><Weight v={v} /></li>
      ))}
    </ol>
  );
}
