export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-panel">
      <div className="flex flex-col gap-4 px-6 py-5 text-xs text-muted sm:px-10 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
          <span>d4rkc0de</span>
          <span>© 2026</span>
          <span>Indraprastha Institute of Information Technology Delhi</span>
        </div>
        <div className="flex items-center gap-6">
          <span>&lt;time&gt;</span>
          <span>{"//"}</span>
          <span>0x00</span>
        </div>
      </div>
    </footer>
  );
}
