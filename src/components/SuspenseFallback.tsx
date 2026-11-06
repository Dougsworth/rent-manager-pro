export function SuspenseFallback() {
  return (
    <div role="status" aria-busy="true" className="flex items-center gap-3 py-16 text-[15px] text-quiet">
      <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-rule border-t-shell" />
      Loading
    </div>
  );
}
