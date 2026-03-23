import { Routes, Route } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import HomePage from '@/pages/HomePage';
import NewReminderPage from '@/pages/NewReminderPage';
import ReminderDetailPage from '@/pages/ReminderDetailPage';
import CategoriesPage from '@/pages/CategoriesPage';
import SettingsPage from '@/pages/SettingsPage';
import ReportPage from '@/pages/ReportPage';

export default function App() {
  useTheme();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/reminders/new" element={<NewReminderPage />} />
      <Route path="/reminders/:id" element={<ReminderDetailPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/reports" element={<ReportPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}
