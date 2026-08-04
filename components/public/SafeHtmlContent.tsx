import { sanitizeHtmlServer } from "@/lib/rich-text/server-sanitizer";

interface SafeHtmlContentProps {
  html: string | null | undefined;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Server component for rendering sanitized HTML content
 * HTML sanitization happens on the server for better performance and security
 */
export default function SafeHtmlContent({
  html,
  className = "",
  fallback = null,
}: SafeHtmlContentProps) {
  const sanitizedString = sanitizeHtmlServer(html);

  if (!sanitizedString || sanitizedString === "<p><br></p>" || sanitizedString === "<p></p>") {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  return (
    <div
      className={`rich-text-content ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedString }}
    />
  );
}
