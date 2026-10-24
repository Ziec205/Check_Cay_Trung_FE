import { fmt0 } from './calc.js';

// Số cây theo từng loại kg, kèm thanh tỉ lệ.
export default function Breakdown({ s }) {
  const kgs = Object.keys(s.byKg).map(Number).sort((a, b) => a - b);
  const max = Math.max(1, ...kgs.map((kg) => s.byKg[kg]));
  return (
    <table className="breakdown">
      <thead>
        <tr>
          <th scope="col">Loại</th>
          <th scope="col" className="num">Số cây</th>
          <th scope="col" className="bar-col"><span className="sr-only">Tỉ lệ</span></th>
          <th scope="col" className="num">Kg nguyên</th>
        </tr>
      </thead>
      <tbody>
        {kgs.map((kg) => (
          <tr key={kg}>
            <th scope="row">{kg} kg</th>
            <td className="num">{s.byKg[kg]}</td>
            <td className="bar-col"><span className="bar" style={{ '--w': s.byKg[kg] / max }} /></td>
            <td className="num">{fmt0(kg * s.byKg[kg])}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">Tổng</th>
          <td className="num">{s.count}</td>
          <td className="bar-col" />
          <td className="num">{fmt0(s.wholeKg)}</td>
        </tr>
      </tfoot>
    </table>
  );
}
