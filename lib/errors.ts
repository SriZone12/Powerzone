export function friendlyError(code?: string | null): string {
  switch (code) {
    case "42501":
      return "You don't have permission to do that. Please sign in again.";
    case "23505":
      return "A record with the same value already exists.";
    case "23514":
      return "One of the values doesn't match the allowed options.";
    case "23503":
      return "This record is still referenced by other data and can't be changed.";
    case "42P01":
      return "The requested data doesn't exist in the database.";
    default:
      return "Something went wrong. Please try again.";
  }
}