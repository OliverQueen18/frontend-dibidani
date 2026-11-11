import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { connectedBackground } from './photo-editing';

@Component({
  selector: 'app-photo-editor', standalone: true, imports: [CommonModule, FormsModule],
  template: `
  <section class="editor" aria-label="Retouche photo">
    <header><div><b>Retoucher la photo</b><p>Sélectionnez en rouge les parties à supprimer, puis effacez-les.</p></div>
      <button type="button" (click)="closed.emit()" aria-label="Fermer la retouche">Fermer</button></header>
    <p class="error" role="alert" *ngIf="error">{{error}}</p>
    <p role="status" *ngIf="!ready && !error">Chargement de la photo…</p>
    <fieldset [disabled]="!ready || exporting">
      <div class="toolbar" role="group" aria-label="Outils de sélection">
        <button type="button" [class.active]="tool==='brush'" [attr.aria-pressed]="tool==='brush'" (click)="tool='brush'">Pinceau</button>
        <button type="button" [class.active]="tool==='rectangle'" [attr.aria-pressed]="tool==='rectangle'" (click)="tool='rectangle'">Rectangle</button>
        <button type="button" [class.active]="tool==='background'" [attr.aria-pressed]="tool==='background'" (click)="tool='background'">Sélectionner le fond</button>
        <label *ngIf="tool==='brush'">Taille du pinceau : {{brush}} px<input type="range" min="4" max="150" [(ngModel)]="brush"></label>
        <label>Tolérance du fond : {{tolerance}}<input type="range" min="5" max="100" [(ngModel)]="tolerance"></label>
      </div>
      <p class="help">{{tool==='background' ? 'Cliquez sur le fond pour sélectionner sa couleur et les pixels voisins. Ajustez la tolérance puis cliquez à nouveau.' : 'Faites glisser sur la photo avec la souris ou le doigt. Les sélections s’ajoutent.'}}</p>
      <div class="viewport"><canvas #surface aria-label="Photo à retoucher : tracer une sélection avec la souris ou le doigt"
        (pointerdown)="start($event)" (pointermove)="move($event)" (pointerup)="finish($event)" (pointercancel)="cancelStroke($event)"></canvas></div>
      <div class="toolbar">
        <button type="button" class="primary" (click)="erase()" [disabled]="!selected">Supprimer la sélection</button>
        <button type="button" (click)="clearSelection()" [disabled]="!selected">Désélectionner</button>
        <button type="button" (click)="removeBackground()">Supprimer le fond uni</button>
        <button type="button" (click)="undo()" [disabled]="!history.length">Annuler la retouche</button>
        <button type="button" (click)="reset()">Réinitialiser</button>
      </div>
      <p class="help">Le damier représente la transparence. Pour un fond complexe, utilisez le pinceau ou le rectangle. La suppression du fond uni part des coins de l’image.</p>
      <div class="toolbar adjustments">
        <label>Luminosité : {{brightness}} %<input type="range" min="50" max="150" [(ngModel)]="brightness"></label>
        <label>Contraste : {{contrast}} %<input type="range" min="50" max="150" [(ngModel)]="contrast"></label>
        <button type="button" (click)="adjust()">Appliquer les réglages</button>
      </div>
      <footer><button type="button" (click)="download()">Télécharger en PNG transparent</button>
        <button type="button" class="primary" (click)="save()">Ajouter la version retouchée</button></footer>
      <p class="help">La version catalogue est enregistrée sur fond blanc. L’original est conservé. Export jusqu’à 1 600 px.</p>
    </fieldset>
    <p role="status">{{message}}</p>
  </section>`,
  styles: [`
    :host{display:block}.editor{border:1px solid #a8cabb;border-radius:12px;background:#f7fbf9;padding:16px;color:#173b30}
    header,footer,.toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}header{justify-content:space-between}header p,.help{font-size:12px;color:#53695f;margin:8px 0 12px}
    fieldset{border:0;padding:0;margin:0;min-width:0}button{padding:9px 12px;border:1px solid #bfd4c8;border-radius:8px;background:white;color:#176242;cursor:pointer;min-height:42px}
    button.active,button.primary{background:#087a47;color:white;border-color:#087a47}button:disabled{opacity:.45;cursor:default}button:focus-visible,input:focus-visible{outline:3px solid #e6ac35;outline-offset:2px}
    label{font-size:12px;display:flex;flex-direction:column;gap:5px}.viewport{margin:12px 0;background:#e7eeea;border-radius:8px;overflow:hidden;text-align:center}
    canvas{display:block;max-width:100%;height:auto;margin:auto;touch-action:none;cursor:crosshair;background-color:#fff;background-image:linear-gradient(45deg,#dde5e0 25%,transparent 25%),linear-gradient(-45deg,#dde5e0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#dde5e0 75%),linear-gradient(-45deg,transparent 75%,#dde5e0 75%);background-size:20px 20px;background-position:0 0,0 10px,10px -10px,-10px 0}
    .adjustments{border-top:1px solid #d6e5dc;padding:12px 0;margin-top:12px}footer{justify-content:flex-end}.error{color:#b42318}p[role=status]{font-size:12px;margin-bottom:0}
    @media(max-width:600px){.editor{padding:10px}.toolbar button,footer button{flex:1}label{flex:1;min-width:120px}}
  `]
})
export class PhotoEditorComponent implements AfterViewInit, OnDestroy {
  @Input() src = '';
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<File>();
  @ViewChild('surface', {static: true}) surface!: ElementRef<HTMLCanvasElement>;
  tool: 'brush' | 'rectangle' | 'background' = 'brush';
  brush = 35; tolerance = 30; brightness = 100; contrast = 100;
  ready = false; exporting = false; selected = false; error = ''; message = '';
  history: ImageData[] = [];
  private work = document.createElement('canvas');
  private mask = document.createElement('canvas');
  private original?: ImageData;
  private stroke?: {id: number; x: number; y: number; lastX: number; lastY: number; mask: ImageData};
  private destroyed = false;

  ngAfterViewInit() {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (this.destroyed) return;
      const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      for (const c of [this.work, this.mask, this.surface.nativeElement]) {
        c.width = Math.max(1, Math.round(img.naturalWidth * scale));
        c.height = Math.max(1, Math.round(img.naturalHeight * scale));
      }
      try {
        this.ctx.drawImage(img, 0, 0, this.work.width, this.work.height);
        this.original = this.snapshot();
        this.ready = true;
        this.render();
      } catch { this.error = 'Cette image ne permet pas la retouche. Importez-la depuis votre appareil.'; }
    };
    img.onerror = () => { if (!this.destroyed) this.error = 'Image inaccessible. Importez-la depuis votre appareil pour la retoucher.'; };
    img.src = this.src;
  }
  ngOnDestroy() { this.destroyed = true; this.history = []; }
  private get ctx() { return this.work.getContext('2d')!; }
  private get selection() { return this.mask.getContext('2d')!; }
  private snapshot() { return this.ctx.getImageData(0, 0, this.work.width, this.work.height); }
  private remember() { this.history.push(this.snapshot()); if (this.history.length > 8) this.history.shift(); }
  private point(e: PointerEvent) {
    const c = this.surface.nativeElement, r = c.getBoundingClientRect();
    return {x: Math.max(0, Math.min(c.width - 1, (e.clientX - r.left) * c.width / r.width)),
      y: Math.max(0, Math.min(c.height - 1, (e.clientY - r.top) * c.height / r.height))};
  }
  start(e: PointerEvent) {
    if (!this.ready || this.exporting || this.stroke || e.button !== 0) return;
    e.preventDefault();
    const p = this.point(e);
    if (this.tool === 'background') { this.selectBackground([Math.floor(p.y) * this.work.width + Math.floor(p.x)]); return; }
    this.surface.nativeElement.setPointerCapture(e.pointerId);
    this.stroke = {id: e.pointerId, ...p, lastX: p.x, lastY: p.y,
      mask: this.selection.getImageData(0, 0, this.mask.width, this.mask.height)};
    this.move(e);
  }
  move(e: PointerEvent) {
    const s = this.stroke;
    if (!s || s.id !== e.pointerId) return;
    const p = this.point(e), ctx = this.selection;
    ctx.fillStyle = ctx.strokeStyle = '#ef4444';
    if (this.tool === 'rectangle') {
      ctx.putImageData(s.mask, 0, 0);
      ctx.fillRect(Math.min(s.x, p.x), Math.min(s.y, p.y), Math.max(1, Math.abs(p.x - s.x)), Math.max(1, Math.abs(p.y - s.y)));
    } else {
      ctx.lineWidth = Number(this.brush); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(s.lastX, s.lastY); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.beginPath(); ctx.arc(p.x, p.y, Number(this.brush) / 2, 0, Math.PI * 2); ctx.fill();
    }
    s.lastX = p.x; s.lastY = p.y; this.selected = true; this.render();
  }
  finish(e: PointerEvent) {
    if (this.stroke?.id !== e.pointerId) return;
    this.move(e); this.stroke = undefined;
    this.surface.nativeElement.releasePointerCapture(e.pointerId);
  }
  cancelStroke(e: PointerEvent) {
    if (this.stroke?.id !== e.pointerId) return;
    this.selection.putImageData(this.stroke.mask, 0, 0); this.stroke = undefined;
    this.selected = this.selection.getImageData(0, 0, this.mask.width, this.mask.height).data.some((v, i) => i % 4 === 3 && v > 0);
    this.render();
  }
  clearSelection() { this.selection.clearRect(0, 0, this.mask.width, this.mask.height); this.selected = false; this.render(); }
  private render() {
    const c = this.surface.nativeElement, ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, c.width, c.height); ctx.drawImage(this.work, 0, 0);
    ctx.globalAlpha = 0.5; ctx.drawImage(this.mask, 0, 0); ctx.globalAlpha = 1;
  }
  private selectBackground(seeds: number[]) {
    const pixels = this.snapshot();
    const selection = connectedBackground(pixels.data, pixels.width, pixels.height, seeds, Number(this.tolerance));
    const overlay = this.selection.createImageData(pixels.width, pixels.height);
    this.selected = false;
    for (let i = 0; i < selection.length; i++) {
      overlay.data[i * 4] = 239; overlay.data[i * 4 + 1] = 68; overlay.data[i * 4 + 2] = 68;
      overlay.data[i * 4 + 3] = selection[i];
      if (selection[i]) this.selected = true;
    }
    this.selection.putImageData(overlay, 0, 0); this.render();
  }
  removeBackground() {
    const w = this.work.width, h = this.work.height;
    this.selectBackground([0, w - 1, (h - 1) * w, w * h - 1]);
    this.erase(); this.message = 'Fond uni supprimé. Annulez si le produit a été touché, puis réduisez la tolérance.';
  }
  erase() {
    if (!this.selected) return;
    this.remember(); this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.drawImage(this.mask, 0, 0); this.ctx.globalCompositeOperation = 'source-over';
    this.clearSelection(); this.message = 'Sélection supprimée. Vous pouvez annuler cette retouche.';
  }
  undo() { const previous = this.history.pop(); if (previous) { this.ctx.putImageData(previous, 0, 0); this.clearSelection(); this.message = 'Retouche annulée.'; } }
  reset() { if (this.original) { this.remember(); this.ctx.putImageData(this.original, 0, 0); this.clearSelection(); this.brightness = this.contrast = 100; this.message = 'Photo réinitialisée.'; } }
  adjust() {
    this.remember(); const pixels = this.snapshot();
    for (let i = 0; i < pixels.data.length; i += 4) for (let c = 0; c < 3; c++)
      pixels.data[i + c] = (pixels.data[i + c] - 128) * Number(this.contrast) / 100 + 128 + (Number(this.brightness) - 100) * 2.55;
    this.ctx.putImageData(pixels, 0, 0); this.brightness = this.contrast = 100; this.render(); this.message = 'Réglages appliqués.';
  }
  download() {
    this.exporting = true;
    this.work.toBlob(blob => {
      this.exporting = false; if (!blob || this.destroyed) return;
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = 'dibidani-retouche.png'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  }
  save() {
    const result = document.createElement('canvas'); result.width = this.work.width; result.height = this.work.height;
    const ctx = result.getContext('2d')!; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, result.width, result.height); ctx.drawImage(this.work, 0, 0);
    this.exporting = true;
    result.toBlob(blob => {
      this.exporting = false; if (this.destroyed) return;
      if (!blob) { this.error = 'Export impossible. Réessayez.'; return; }
      this.saved.emit(new File([blob], 'dibidani-retouche.jpg', {type: 'image/jpeg'}));
    }, 'image/jpeg', 0.94);
  }
}
