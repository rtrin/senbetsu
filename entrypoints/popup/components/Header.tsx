interface HeaderProps {
  tabCount: number;
}

export function Header({ tabCount }: HeaderProps) {
  return (
    <header className="popup-header">
      <h1 className="popup-header__title">senbetsu</h1>
      <div className="popup-header__actions">
        <a
          href="https://forms.gle/byoqKeuAcLdpdamA7"
          target="_blank"
          rel="noreferrer"
          className="popup-header__link"
        >
          Feedback
        </a>
        <span className="popup-header__count">
          {tabCount} tab{tabCount !== 1 ? 's' : ''} open
        </span>
      </div>
    </header>
  );
}
