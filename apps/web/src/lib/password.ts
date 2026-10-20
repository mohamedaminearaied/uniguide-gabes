/** Returns a translation key describing what is wrong with a password, or null when it is acceptable. */
export function passwordIssue(pw: string): 'auth.weakPassword' | null {
  if (pw.length < 8) return 'auth.weakPassword';
  if (!/[A-Za-z\u0600-\u06FF]/.test(pw) || !/\d/.test(pw)) return 'auth.weakPassword';
  return null;
}
