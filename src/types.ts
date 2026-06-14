// Shared navigation type used across all views.
// Define once here — import everywhere else.
export type ViewState =
  | 'login'
  | 'register'
  | 'forgot'
  | 'dashboard'
  | 'add-bill'
  | 'settings';
