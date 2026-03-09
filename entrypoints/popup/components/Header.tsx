interface HeaderProps {
  tabCount: number;
}

export function Header({ tabCount }: HeaderProps) {
  return (
    <header className="flex items-baseline justify-between">
      <h1 className="font-bold text-lg tracking-tight">senbetsu</h1>
      <div className="flex items-baseline gap-3">
        <a
          href="https://forms.gle/byoqKeuAcLdpdamA7"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-(--color-grey) text-[11px] no-underline transition-colors duration-150 hover:text-white/87 light:hover:text-(--color-text-light)"
        >
          Feedback
        </a>
        <span className="text-(--color-grey) text-xs">
          {tabCount} tab{tabCount !== 1 ? 's' : ''} open
        </span>
      </div>
    </header>
  );
}
