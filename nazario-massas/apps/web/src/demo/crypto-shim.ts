// Browser stand-in for the two node:crypto helpers the order service uses (demo build only).
export function randomUUID(): string {
  return crypto.randomUUID();
}

export function randomBytes(size: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return {
    toString: () => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  };
}
