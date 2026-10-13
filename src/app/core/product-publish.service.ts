import { Injectable, signal } from '@angular/core';

export interface ProductPublishSession {
  mode: 'create' | 'edit';
  id?: number;
  draft?: any;
}

@Injectable({ providedIn: 'root' })
export class ProductPublishService {
  session = signal<ProductPublishSession | null>(null);
  lastSavedAt = signal(0);

  openNew() {
    this.session.set({ mode: 'create' });
  }

  openEdit(id: number, draft?: any) {
    this.session.set({ mode: 'edit', id, draft });
  }

  close() {
    this.session.set(null);
  }

  markSaved() {
    this.lastSavedAt.set(Date.now());
    this.close();
  }
}
