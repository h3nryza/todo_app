import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FAB() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate('/reminders/new')}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 active:scale-95 z-50"
      style={{ backgroundColor: 'var(--accent)' }}
      aria-label="Create new reminder"
    >
      <Plus size={24} />
    </button>
  );
}
