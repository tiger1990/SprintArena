export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
}

export class LocalStorageAdapter implements StorageAdapter {
  private prefix: string

  constructor(prefix = 'sprintbrain') {
    this.prefix = prefix
  }

  private key(k: string): string {
    return `${this.prefix}:${k}`
  }

  async get<T>(key: string): Promise<T | null> {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(this.key(key))
      if (!raw) return null
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.key(key), JSON.stringify(value))
  }

  async delete(key: string): Promise<void> {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.key(key))
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined') return
    Object.keys(localStorage)
      .filter(k => k.startsWith(this.prefix))
      .forEach(k => localStorage.removeItem(k))
  }
}

export const storage = new LocalStorageAdapter()
