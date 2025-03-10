type WebStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

interface StorageWrapper {
  session: WebStorage;
  local: WebStorage;
}

export interface StorageAPI {
  setItem(key: string, value: string): boolean;
  getItem(key: string): string | null;
  removeItem(key: string): void;
}

class SafeStorage implements StorageAPI {
  private readonly storageAvailable: boolean;

  constructor() {
    this.storageAvailable = typeof window !== 'undefined' &&
      window.localStorage !== null &&
      window.sessionStorage !== null;
  }

  private getStorages(): StorageWrapper | null {
    if (!this.storageAvailable) return null;
    return {
      session: window.sessionStorage,
      local: window.localStorage
    };
  }

  private isValidStorage(storage: StorageWrapper | null): storage is StorageWrapper {
    return storage !== null &&
           storage.session !== null &&
           storage.local !== null;
  }

  setItem(key: string, value: string): boolean {
    try {
      const storages = this.getStorages();
      if (!this.isValidStorage(storages)) return false;

      storages.session.setItem(key, value);
      storages.local.setItem(key, value);
      return true;
    } catch (e) {
      console.error('Failed to set storage item:', e);
      return false;
    }
  }

  getItem(key: string): string | null {
    try {
      const storages = this.getStorages();
      if (!this.isValidStorage(storages)) return null;

      return storages.session.getItem(key) ||
             storages.local.getItem(key);
    } catch (e) {
      console.error('Failed to get storage item:', e);
      return null;
    }
  }

  removeItem(key: string): void {
    try {
      const storages = this.getStorages();
      if (!this.isValidStorage(storages)) return;

      storages.session.removeItem(key);
      storages.local.removeItem(key);
    } catch (e) {
      console.error('Failed to remove storage item:', e);
    }
  }
}

export const createStorage = (): StorageAPI => new SafeStorage();