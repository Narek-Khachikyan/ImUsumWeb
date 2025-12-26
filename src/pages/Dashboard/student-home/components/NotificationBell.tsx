interface NotificationBellProps {
  count: number;
}

const NotificationBell = ({ count }: NotificationBellProps) => (
  <button type="button" className="relative" aria-label="Ծանուցումներ">
    <svg className="h-7 w-7 text-blue-main" viewBox="0 0 28 33" fill="currentColor">
      <path d="M14 0C6.268 0 0 6.268 0 14v5c0 2.761-1.5 5.5-1.5 8.5 0 1.933 1.567 3.5 3.5 3.5h24c1.933 0 3.5-1.567 3.5-3.5 0-3-1.5-5.739-1.5-8.5v-5C28 6.268 21.732 0 14 0zm0 33c-1.657 0-3-1.343-3-3h6c0 1.657-1.343 3-3 3z" />
    </svg>
    {count > 0 && (
      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
        {count}
      </span>
    )}
  </button>
);

export default NotificationBell;
