import type { ReactNode } from 'react';

/** Phone-first shell. One column, generous side gutters, nothing under 16px. */
export function Screen({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}): JSX.Element {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-paper">
      <main className="flex-1 w-full max-w-[430px] mx-auto px-4 pb-6">{children}</main>
      {footer && (
        <div className="sticky bottom-0 w-full bg-paper border-t border-line">
          <div className="w-full max-w-[430px] mx-auto px-4 py-3">{footer}</div>
        </div>
      )}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}): JSX.Element {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="btn-primary target w-full px-5 py-3 text-lg"
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="btn-secondary target w-full px-5 py-3"
    >
      {children}
    </button>
  );
}

/** Back link + XP and streak. Present on every screen after onboarding. */
export function TopBar({
  onBack,
  backLabel = 'Back',
  xp,
  streak,
  onProfile,
}: {
  onBack?: () => void;
  backLabel?: string;
  xp: number;
  streak: number;
  onProfile?: () => void;
}): JSX.Element {
  return (
    <header className="flex items-center justify-between gap-2 py-2">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="target -ml-2 px-2 text-brand-ink font-semibold"
        >
          <span aria-hidden="true">&larr;</span> {backLabel}
        </button>
      ) : (
        <span className="font-display font-bold text-lg">Tikerino</span>
      )}

      <button
        type="button"
        onClick={onProfile}
        className="target flex items-center gap-3 px-2"
        aria-label={`Your progress: ${xp} XP, ${streak} day streak`}
      >
        <span className="pill bg-sun-soft text-ink px-3 py-1 text-sm font-bold tabular">
          {xp} XP
        </span>
        <span className="pill bg-brand-soft text-brand-ink px-3 py-1 text-sm font-bold tabular">
          <span aria-hidden="true">&#9670;</span> {streak}
        </span>
      </button>
    </header>
  );
}

export function Callout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <p className="card bg-sun-soft border-sun px-4 py-3 text-sm m-0">{children}</p>
  );
}
