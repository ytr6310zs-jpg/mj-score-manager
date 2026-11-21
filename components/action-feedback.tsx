import { cn } from "@/lib/utils";

type Props = {
  success: boolean;
  message: string;
  className?: string;
};

export function ActionFeedback({ success, message, className }: Props) {
  if (!message) return null;

  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        "text-xs",
        success ? "text-emerald-700" : "text-destructive",
        className
      )}
    >
      {message}
    </p>
  );
}
