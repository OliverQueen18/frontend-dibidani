import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Worker } from 'tesseract.js';

@Component({
  selector: 'app-ocr-capture', standalone: true, imports: [CommonModule, FormsModule],
  template: `
    <input #camera type="file" accept="image/*" capture="environment" hidden (change)="read($event)">
    <input #file type="file" accept="image/*" hidden (change)="read($event)">
    <div class="actions">
      <button type="button" [disabled]="busy" (click)="camera.click()">Photographier le texte</button>
      <button type="button" [disabled]="busy" (click)="file.click()">Importer une image</button>
    </div>
    <small role="status" *ngIf="busy">Lecture du texte… {{progress}} %</small>
    <small role="alert" *ngIf="error">{{error}}</small>
    <div *ngIf="text">
      <label>Texte reconnu pour {{label}} — vérifiez avant insertion
        <textarea [(ngModel)]="text" [ngModelOptions]="{standalone: true}"></textarea>
      </label>
      <button type="button" (click)="insert()">Ajouter au champ {{label}}</button>
      <button type="button" (click)="text=''">Ignorer</button>
    </div>`,
  styles: [`:host{display:block;margin:4px 0 10px}.actions{display:flex;gap:8px;flex-wrap:wrap}button{border:1px solid #c5ddd2;border-radius:7px;background:#eef9f3;color:#087a47;padding:8px;cursor:pointer}button:disabled{opacity:.5}small{display:block;margin:6px 0}label{display:block;font-size:12px;margin-top:8px}textarea{display:block;box-sizing:border-box;width:100%;min-height:100px;margin:5px 0;border:1px solid #c5ddd2;border-radius:7px;padding:8px}`]
})
export class OcrCaptureComponent implements OnDestroy {
  @Input() label = '';
  @Output() captured = new EventEmitter<string>();
  busy = false; progress = 0; error = ''; text = '';
  private worker?: Worker;
  private destroyed = false;

  async read(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0]; input.value = '';
    if (!file || this.busy) return;
    this.error = '';
    if (!file.type.startsWith('image/') || file.size > 15 * 1024 * 1024) {
      this.error = 'Choisissez une image de moins de 15 Mo.'; return;
    }
    this.busy = true; this.progress = 0; this.text = '';
    let worker: Worker | undefined;
    try {
      const { createWorker } = await import('tesseract.js');
      if (this.destroyed) return;
      worker = await createWorker('fra+eng', 1, {
        workerPath: '/assets/ocr/worker.min.js', corePath: '/assets/ocr/',
        logger: m => { if (!this.destroyed) this.progress = Math.round((m.progress || 0) * 100); }
      });
      if (this.destroyed) return;
      this.worker = worker;
      const result = await worker.recognize(file);
      if (this.destroyed) return;
      this.text = result.data.text.trim();
      if (!this.text) this.error = 'Aucun texte détecté. Essayez une photo plus nette et bien éclairée.';
    } catch {
      if (!this.destroyed) this.error = 'Lecture impossible. Vérifiez votre connexion et réessayez avec une photo nette.';
    } finally {
      if (worker) await worker.terminate().catch(() => {});
      this.worker = undefined; this.busy = false;
    }
  }
  insert() { if (this.text.trim()) this.captured.emit(this.text.trim()); this.text = ''; }
  ngOnDestroy() { this.destroyed = true; void this.worker?.terminate(); this.worker = undefined; }
}
