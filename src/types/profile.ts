export interface ProfileUser {
  name: string | null;
  email: string;
  image: string | null;
  createdAt: Date;
  // False for OAuth-only accounts, which have no password to change.
  hasPassword: boolean;
  // Linked OAuth providers, e.g. ["github"].
  providers: string[];
}
