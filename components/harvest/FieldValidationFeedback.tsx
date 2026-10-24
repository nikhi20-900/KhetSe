export function FieldValidationFeedback({
  id,
  message,
}: {
  id: string;
  message?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} role="alert" className="text-sm text-red-700 dark:text-red-300">
      {message}
    </p>
  );
}
