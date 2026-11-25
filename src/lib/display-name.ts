export function displayName(user: { name?: string | null; email: string }): string {
  return user.name || user.email.replace(/@.*$/, '')
}
