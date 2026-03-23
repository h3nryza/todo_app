import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Bell, FolderOpen, Settings, Plus, Star, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { useCategories } from '@/hooks/useCategories';
import { useAppStore } from '@/store/app.store';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/categories', icon: FolderOpen, label: 'Categories' },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: categories } = useCategories();
  const { selectedCategory, setSelectedCategory } = useAppStore();

  const favoriteCategories = categories.filter((c) => c.isFavorite);

  return (
    <aside
      className="w-64 h-screen flex flex-col border-r flex-shrink-0"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Bell size={16} className="text-white" />
          </div>
          <span
            className="text-lg font-bold"
            style={{ color: 'var(--text-primary)' }}
            title="What I Would Forget"
          >
            WIWF
          </span>
        </div>
      </div>

      {/* New Reminder button */}
      <div className="px-3 mb-4">
        <button
          type="button"
          onClick={() => navigate('/reminders/new')}
          className="btn-primary w-full gap-2"
        >
          <Plus size={16} />
          New Reminder
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => {
                navigate(item.path);
                if (item.path === '/') setSelectedCategory(null);
              }}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2 rounded-soft text-sm font-medium transition-all duration-150',
                isActive ? 'text-white' : 'hover:opacity-80',
              )}
              style={
                isActive ? { backgroundColor: 'var(--accent)' } : { color: 'var(--text-primary)' }
              }
            >
              <item.icon size={18} />
              {item.label}
            </button>
          );
        })}

        {/* Category filters */}
        {favoriteCategories.length > 0 && (
          <>
            <div className="pt-5 pb-1 px-3">
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-secondary)' }}
              >
                Favorites
              </span>
            </div>
            {favoriteCategories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(isActive ? null : cat.id);
                    if (location.pathname !== '/') navigate('/');
                  }}
                  className={clsx(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-soft text-sm transition-all duration-150',
                  )}
                  style={{
                    backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="flex-1 text-left truncate">{cat.name}</span>
                  <Star size={12} className="text-amber-400 flex-shrink-0" fill="currentColor" />
                </button>
              );
            })}
          </>
        )}
      </nav>

      {/* Version footer */}
      <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          WIWF v1.0.0
        </span>
      </div>
    </aside>
  );
}
