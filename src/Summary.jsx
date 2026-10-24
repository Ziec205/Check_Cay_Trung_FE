import { fmt1 } from './calc.js';

// Bảng thống kê: số cây theo từng loại kg, tổng kg nguyên, tổng kg dư.
export default function Summary({ s }) {
  const kgs = Object.keys(s.byKg).map(Number).sort((a, b) => a - b);
  return (
    <div className="summary">
      <table>
        <thead>
          <tr><th>Loại</th><th>Số cây</th><th>Kg nguyên</th></tr>
        </thead>
        <tbody>
          {kgs.map((kg) => (
            <tr key={kg}>
              <td>{kg} kg</td>
              <td>{s.byKg[kg]}</td>
              <td>{kg * s.byKg[kg]}</td>
            </tr>
          ))}
          <tr className="total">
            <td>Tổng</td>
            <td>{s.count}</td>
            <td>{s.wholeKg}</td>
          </tr>
        </tbody>
      </table>
      <p className="rem">Tổng kg dư: <b>{fmt1(s.remKg)} kg</b></p>
    </div>
  );
}
