type ExternalFieldLinkProps = {
  type: "website" | "linkedin" | "email";
  value: string;
};

function isMissing(value: string) {
  const normalized = value.trim().toLowerCase();
  return !normalized || normalized === "not found";
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed
    : `https://${trimmed}`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function ExternalFieldLink({ type, value }: ExternalFieldLinkProps) {
  if (isMissing(value)) {
    return <span className="text-muted-foreground">Not found</span>;
  }

  if (type === "email") {
    if (!isValidEmail(value)) {
      return <span className="text-muted-foreground">Not found</span>;
    }

    return (
      <a className="text-emerald-800 underline-offset-2 hover:underline" href={`mailto:${value.trim()}`}>
        {value}
      </a>
    );
  }

  const href = normalizeUrl(value);

  return (
    <a
      className="break-words text-emerald-800 underline-offset-2 hover:underline"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
      onClick={(event) => event.stopPropagation()}
    >
      {value}
    </a>
  );
}
