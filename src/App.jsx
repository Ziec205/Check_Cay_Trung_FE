import { useState } from 'react';
import Home from './Home.jsx';
import Entry from './Entry.jsx';
import History from './History.jsx';

const TABS = [
  ['home', 'Trang chủ'],
  ['entry', 'Nhập số liệu'],
  ['history', 'Các lần nhập'],
];

export default function App() {
  const [tab, setTab] = useState('home');
  const [month, setMonth] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="app">
      <header>
        <h1>🥚 Sổ trứng</h1>
        <nav>
          {TABS.map(([id, label]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>
          ))}
        </nav>
      </header>
      <main>
        {tab === 'home' && (
          <Home
            refreshKey={refreshKey}
            onOpenMonth={(m) => { setMonth(m); setTab('history'); }}
          />
        )}
        {tab === 'entry' && <Entry onSaved={refresh} />}
        {tab === 'history' && (
          <History month={month} setMonth={setMonth} refreshKey={refreshKey} onChanged={refresh} />
        )}
      </main>
    </div>
  );
}
