interface OnboardingBannerProps {
  tabCount: number;
  onAccept: () => void;
  onDismiss: () => void;
}

export function OnboardingBanner({ tabCount, onAccept, onDismiss }: OnboardingBannerProps) {
  return (
    <div className="onboarding-banner">
      <p className="onboarding-banner__text">
        You have <strong>{tabCount}</strong> unorganized tab{tabCount !== 1 ? 's' : ''}. Want to
        clean them up?
      </p>
      <div className="onboarding-banner__actions">
        <button type="button" className="btn btn--primary btn--sm" onClick={onAccept}>
          Clean up now
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
