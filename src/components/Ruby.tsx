export function Ruby({ base, reading }: { base: string; reading: string }) {
  return (
    <>
      <ruby aria-hidden="true">
        {base}
        <rt>{reading}</rt>
      </ruby>
      <span className="sr-only">{reading}</span>
    </>
  );
}
