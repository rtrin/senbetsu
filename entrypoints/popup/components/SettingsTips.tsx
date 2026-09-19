const linkClass =
  'cursor-pointer border-0 bg-transparent p-0 font-sans text-blue-500 text-xs no-underline hover:underline';

function Tip({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="shrink-0 text-[14px] leading-[1.5]">{icon}</span>
      <p className="m-0 text-(--color-grey) text-xs leading-[1.5]">{children}</p>
    </div>
  );
}

export function SettingsTips() {
  return (
    <div className="flex flex-col gap-2 border-white/10 light:border-black/10 border-t pt-4">
      <h3 className="m-0 font-semibold text-(--color-grey) text-[11px] uppercase tracking-wider">
        Tips
      </h3>
      <Tip icon="⌨️">
        Set a keyboard shortcut to open Senbetsu quickly.{' '}
        <button
          type="button"
          className={linkClass}
          onClick={() => chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })}
        >
          Open shortcut settings →
        </button>
      </Tip>
      <Tip icon="☕">
        Love Senbetsu?{' '}
        <button
          type="button"
          className={linkClass}
          onClick={() => chrome.tabs.create({ url: 'https://ko-fi.com/8bits' })}
        >
          Support development on Ko-fi →
        </button>
      </Tip>
    </div>
  );
}
