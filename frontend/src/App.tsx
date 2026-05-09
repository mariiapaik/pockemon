import { Routes, Route, Link } from 'react-router-dom';
import { MainPage } from './pages/MainPage';
import { CreateListPage } from './pages/CreateListPage';
import { ViewListPage } from './pages/ViewListPage.tsx';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      <nav className="sticky top-0 z-20 border-b border-slate-800/60 bg-slate-950/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="font-bold text-xl tracking-tight flex items-center gap-2"
          >
            <span className="text-2xl">⚡</span>
            <span>
              <span className="text-emerald-400">Poké</span>
              <span className="text-slate-100">Collections</span>
            </span>
          </Link>
          <Link
            to="/lists/new"
            className="text-sm text-slate-300 hover:text-emerald-400 transition"
          >
            + New list
          </Link>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-10">
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/lists/new" element={<CreateListPage />} />
          <Route path="/lists/:id" element={<ViewListPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
