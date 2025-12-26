import type { ReactNode } from 'react';

type NavKey = 'home' | 'book' | 'chat' | 'task' | 'news';

interface NavItem {
  key: NavKey;
  label: string;
  icon: ReactNode;
}

interface BottomNavProps {
  activeKey: NavKey;
  onChange: (key: NavKey) => void;
}

const HomeIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
);

const BookIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
  </svg>
);

const ChatIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
  </svg>
);

const TaskIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 9h-2v2h2v-2zm0 4h-2v2h2v-2zm-6-4h2v2H7v-2zm0 4h2v2H7v-2z" />
  </svg>
);

const NewsIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
  </svg>
);

const navItems: NavItem[] = [
  { key: 'home', label: 'Գլխավոր', icon: <HomeIcon /> },
  { key: 'book', label: 'Դասեր', icon: <BookIcon /> },
  { key: 'chat', label: 'Զրույցներ', icon: <ChatIcon /> },
  { key: 'task', label: 'Առաջադրանքներ', icon: <TaskIcon /> },
  { key: 'news', label: 'Նորություններ', icon: <NewsIcon /> },
];

const BottomNav = ({ activeKey, onChange }: BottomNavProps) => (
  <nav className="fixed bottom-0 left-0 right-0 border-t border-blue-main bg-white shadow-lg lg:hidden">
    <div className="flex items-center justify-around py-2">
      {navItems.map((item) => (
        <button
          key={item.key}
          type="button"
          aria-label={item.label}
          onClick={() => onChange(item.key)}
          className={`rounded-lg p-3 transition-colors ${
            activeKey === item.key
              ? 'text-blue-main'
              : 'text-blue-main/40 hover:text-blue-main/70'
          }`}
        >
          {item.icon}
        </button>
      ))}
    </div>
  </nav>
);

export type { NavKey };
export default BottomNav;
