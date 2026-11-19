import toast from "react-hot-toast";

const MAX_TOAST_LENGTH = 200;

function normalizeMessage(message: string, fallback: string): string {
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return fallback;
  }
  return trimmed.slice(0, MAX_TOAST_LENGTH);
}

/** Display a success toast for messages of 1 to 200 characters. */
export function showSuccess(message: string): string {
  return toast.success(normalizeMessage(message, "Done"));
}

/** Display an error toast for messages of 1 to 200 characters. */
export function showError(message: string): string {
  return toast.error(normalizeMessage(message, "Something went wrong"));
}

/** Display a loading toast for messages of 1 to 200 characters. */
export function showLoading(message: string): string {
  return toast.loading(normalizeMessage(message, "Loading..."));
}
