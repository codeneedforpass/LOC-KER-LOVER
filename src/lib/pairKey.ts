export function pairKeyFor(userIdA: string, userIdB: string): string {
  return [userIdA, userIdB].sort().join(':');
}
