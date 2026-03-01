interface HeaderProps {
  tabCount: number;
}

export function Header({ tabCount }: HeaderProps) {
  return (
    <header className="popup-header">
      <h1 className="popup-header__title">senbetsu</h1>
      <span className="popup-header__count">
        {tabCount} tab{tabCount !== 1 ? 's' : ''} open
      </span>
    </header>
  );
}
