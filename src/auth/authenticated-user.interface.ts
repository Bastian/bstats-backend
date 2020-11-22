export interface AuthenticatedUser {
  uid: string;
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  disabled: boolean;
}
