export function SectionIndicator({
  number,
  name,
}: {
  number: string;
  name: string;
}) {
  return (
    <div className="section-indicator" aria-hidden="true">
      <span>{number}</span>
      <span className="section-indicator__rule" />
      <span>{name}</span>
    </div>
  );
}
