import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { ApiService } from '../core/api.service';

type ShotStatus = 'uploading' | 'queued' | 'processing' | 'ready' | 'failed';

interface Shot {
  key: string;
  assetId?: number;
  jobId?: number;
  originalUrl: string;
  previewUrl: string;
  catalogUrl?: string;
  status: ShotStatus;
  message: string;
  file?: File;
}

@Component({
  selector: 'app-product-photo-studio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="studio">
  <div class="drop" [class.on]="drag" [class.full]="shots.length>=12"
       (dragover)="onDrag($event,true)" (dragleave)="onDrag($event,false)" (drop)="onDrop($event)">
    <input #files type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*" multiple hidden (change)="pickFiles($event)">
    <input #cam type="file" accept="image/*" capture="environment" hidden (change)="pickFiles($event)">
    <b>Studio photo Dibidani</b>
    <span>Prenez une photo ou importez des clichés. Fond blanc, cadrage et signature sont appliqués automatiquement.</span>
    <div class="cta">
      <button type="button" (click)="cam.click()">📷 Photographier</button>
      <button type="button" class="ghost" (click)="files.click()">Importer</button>
      <button type="button" class="ghost" (click)="startLiveCam()" *ngIf="!live">Caméra live</button>
    </div>
  </div>

  <p class="err" *ngIf="err">{{err}}</p>
  <p class="ok" *ngIf="hint">{{hint}}</p>
  <p class="lookup" *ngIf="found">Fiche trouvée : <b>{{found.name}}</b> ({{found.sku}})
    <button type="button" class="ghost" (click)="useFound()">Préremplir</button>
  </p>

  <div class="live" *ngIf="live">
    <video #video autoplay playsinline muted></video>
    <div class="live-actions">
      <button type="button" (click)="captureLive()">Capturer</button>
      <button type="button" class="ghost" (click)="stopLive()">Fermer</button>
    </div>
  </div>

  <article class="shot" *ngFor="let s of shots; let i = index" [class.on]="current===i" [class.vitrine]="isVitrine(s)">
    <div class="badge" *ngIf="isVitrine(s)">Image vitrine</div>
    <div class="compare" (click)="current=i">
      <div>
        <small>Avant</small>
        <img [src]="s.originalUrl" alt="Original">
      </div>
      <div>
        <small>{{s.status==='ready' ? 'Après' : 'Aperçu'}}</small>
        <img [src]="s.previewUrl || s.originalUrl" alt="Résultat">
        <div class="bar" *ngIf="s.status==='uploading' || s.status==='queued' || s.status==='processing'">
          <i [style.width]="s.status==='processing' ? '70%' : s.status==='queued' ? '35%' : '15%'"></i>
        </div>
      </div>
    </div>
    <p class="msg" [class.bad]="s.status==='failed'">{{label(s)}}</p>
    <div class="tools" *ngIf="current===i">
      <button type="button" (click)="run(s,{removeBackground:true,whiteBackground:true,enhance:true,watermark:true,recenter:true})" [disabled]="busy(s)">Améliorer automatiquement</button>
      <button type="button" class="ghost" (click)="run(s,{whiteBackground:true,removeBackground:true,recenter:true})" [disabled]="busy(s)">Fond blanc</button>
      <button type="button" class="ghost" (click)="run(s,{recenter:true,whiteBackground:true})" [disabled]="busy(s)">Recentrer</button>
      <button type="button" class="ghost" (click)="run(s,{watermark:true})" [disabled]="busy(s)">Ajouter signature</button>
      <button type="button" class="ghost" (click)="restart(s)" [disabled]="busy(s)">Recommencer</button>
      <label>Zoom <input type="range" min="70" max="160" [(ngModel)]="zoom" (change)="applyCrop(s)"></label>
      <label>Horizontal <input type="range" min="-30" max="30" [(ngModel)]="offX" (change)="applyCrop(s)"></label>
      <label>Vertical <input type="range" min="-30" max="30" [(ngModel)]="offY" (change)="applyCrop(s)"></label>
    </div>
    <div class="row">
      <button type="button" class="ghost" (click)="makeVitrine(s)" *ngIf="!isVitrine(s)" [disabled]="busy(s) || vitrineBusy">Définir comme image vitrine</button>
      <button type="button" (click)="validate(s, isVitrine(s) || shots.length===1)" [disabled]="s.status!=='ready'">Valider</button>
      <button type="button" class="ghost" (click)="remove(i)">Retirer</button>
    </div>
  </article>
</div>
`,
  styles: [`
.studio{display:flex;flex-direction:column;gap:12px}
.drop{border:2px dashed #b7cfc4;border-radius:12px;padding:20px 14px;text-align:center;background:#f8fbfa}
.drop.on{border-color:#087a47;background:#e8f7ef}
.drop.full{opacity:.55;pointer-events:none}
.drop b{display:block;color:#087a47;margin-bottom:4px}
.drop span{font-size:12px;color:#6a7c75}
.cta{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px}
.cta button,.tools button,.row button{border:0;background:#087a47;color:#fff;border-radius:8px;padding:8px 12px;font-weight:800;cursor:pointer}
.ghost{background:#fff !important;color:#087a47 !important;border:1px solid #c5ddd2 !important}
.err{color:#b42318;font-size:13px;margin:0}.ok{color:#087a47;font-size:13px;margin:0}
.lookup{font-size:13px;background:#eaf7f0;border-radius:8px;padding:8px}
.shot{position:relative;border:1px solid #e2e9e6;border-radius:12px;padding:10px;background:#fff}
.shot.on,.shot.vitrine{border-color:#087a47}
.badge{position:absolute;top:8px;left:8px;z-index:1;background:#087a47;color:#fff;font-size:10px;font-weight:800;letter-spacing:.03em;text-transform:uppercase;border-radius:6px;padding:3px 7px}
.compare{display:grid;grid-template-columns:1fr 1fr;gap:8px;cursor:pointer}
.compare img{width:100%;height:160px;object-fit:contain;background:#fff;border:1px solid #edf1ef;border-radius:8px}
.compare small{font-size:10px;font-weight:800;color:#6a7c75;text-transform:uppercase}
.bar{height:4px;background:#e8eeeb;border-radius:2px;margin-top:6px;overflow:hidden}
.bar i{display:block;height:100%;background:#087a47}
.tools{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
.tools label{font-size:11px;color:#4c5e57;font-weight:700;display:flex;flex-direction:column;min-width:120px}
.row{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.msg{font-size:12px;color:#4c5e57;margin:6px 0}.msg.bad{color:#b42318}
.live{background:#0a3026;border-radius:12px;padding:10px;color:#fff}
.live video{width:100%;max-height:280px;border-radius:8px;background:#06241c}
.live-actions{display:flex;gap:8px;margin-top:8px}
@media(max-width:640px){.compare img{height:120px}.cta button{flex:1}}
`]
})
export class ProductPhotoStudioComponent implements OnDestroy, OnChanges {
  @Input() productId: number | null = null;
  @Input() set barcode(v: string) { if (v && v !== this.lastCode) this.lookup(v); }
  @Input() urls: string[] = [];
  @Output() urlsChange = new EventEmitter<string[]>();
  @Output() productPrefill = new EventEmitter<any>();

  shots: Shot[] = [];
  current = 0;
  vitrineBusy = false;
  drag = false;
  err = '';
  hint = '';
  found: any = null;
  zoom = 100;
  offX = 0;
  offY = 0;
  live = false;
  private lastCode = '';
  private polls = new Map<number, Subscription>();
  private stream?: MediaStream;

  constructor(private api: ApiService) {}

  ngOnChanges(ch: SimpleChanges) {
    if (ch['urls']) this.hydrateUrls();
    if (ch['productId'] && this.productId) this.loadAssets();
  }

  ngOnDestroy() {
    this.polls.forEach(s => s.unsubscribe());
    this.stopLive();
  }

  isVitrine(s: Shot) {
    const url = s.catalogUrl || s.previewUrl;
    return !!url && this.urls[0] === url;
  }

  private shotUrl(s: Shot) { return s.catalogUrl || s.previewUrl; }

  private hydrateUrls() {
    for (const url of this.urls || []) {
      if (!url || this.shots.some(s => this.shotUrl(s) === url || s.originalUrl === url)) continue;
      this.shots = [...this.shots, {
        key: url, originalUrl: url, previewUrl: url, catalogUrl: url, status: 'ready', message: 'Photo du catalogue'
      }];
    }
  }

  private loadAssets() {
    if (!this.productId) return;
    this.api.studioImages(this.productId).subscribe({
      next: rows => {
        for (const a of rows || []) {
          const url = a.masterUrl || a.jpegUrl || a.catalogUrl;
          if (!url) continue;
          const existing = this.shots.find(s => s.assetId === a.id || this.shotUrl(s) === url);
          if (existing) { existing.assetId = a.id; existing.catalogUrl = a.catalogUrl || url; existing.previewUrl = url; }
          else this.shots = [...this.shots, {
            key: 'asset-' + a.id, assetId: a.id, originalUrl: url, previewUrl: url, catalogUrl: a.catalogUrl || url,
            status: 'ready', message: a.confirmed ? 'Photo du catalogue' : 'À valider'
          }];
        }
      },
      error: () => {}
    });
  }

  label(s: Shot) {
    if (s.status === 'uploading') return 'Envoi de la photo…';
    if (s.status === 'queued') return 'En file d’attente du studio…';
    if (s.status === 'processing') return 'Détourage, cadrage et signature…';
    if (s.status === 'failed') return s.message || 'Traitement impossible. Recadrez manuellement ou réessayez.';
    return s.message || 'Prête à valider';
  }
  busy(s: Shot) { return s.status === 'uploading' || s.status === 'queued' || s.status === 'processing'; }

  onDrag(ev: DragEvent, over: boolean) { ev.preventDefault(); this.drag = over; }
  onDrop(ev: DragEvent) {
    ev.preventDefault();
    this.drag = false;
    this.addFiles(Array.from(ev.dataTransfer?.files || []));
  }
  pickFiles(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.addFiles(Array.from(input.files || []));
    input.value = '';
  }

  addFiles(list: File[]) {
    this.err = '';
    for (const file of list) {
      if (this.shots.length >= 12) break;
      if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) continue;
      const url = URL.createObjectURL(file);
      const shot: Shot = { key: file.name + Date.now(), originalUrl: url, previewUrl: url, status: 'uploading', message: '', file };
      this.shots = [...this.shots, shot];
      this.current = this.shots.length - 1;
      this.upload(shot, file);
    }
  }

  private upload(shot: Shot, file: File) {
    this.api.studioUpload(file, this.productId || undefined).subscribe({
      next: a => {
        shot.assetId = a.id;
        this.run(shot, { removeBackground: true, whiteBackground: true, enhance: true, watermark: true, recenter: true, force: true });
      },
      error: e => { shot.status = 'failed'; shot.message = e.error?.message || 'Envoi impossible.'; }
    });
  }

  run(shot: Shot, extra: Record<string, unknown> = {}) {
    if (!shot.assetId) return;
    if (this.busy(shot) && extra['force'] !== true) return;
    shot.status = 'queued';
    shot.message = '';
    const body = {
      assetId: shot.assetId,
      productId: this.productId,
      removeBackground: extra['removeBackground'] !== false,
      whiteBackground: extra['whiteBackground'] !== false,
      enhance: extra['enhance'] !== false,
      watermark: extra['watermark'] !== false,
      recenter: extra['recenter'] !== false,
      zoom: this.zoom / 100,
      offsetX: this.offX / 100,
      offsetY: this.offY / 100,
      ...extra
    };
    this.api.studioProcess(body).subscribe({
      next: job => { shot.jobId = job.id; this.watch(shot); },
      error: e => { shot.status = 'failed'; shot.message = e.error?.message || 'Traitement impossible.'; }
    });
  }

  applyCrop(shot: Shot) {
    if (!shot.assetId || this.busy(shot)) return;
    this.run(shot, { recenter: true, whiteBackground: true, force: true });
  }

  restart(shot: Shot) {
    this.zoom = 100; this.offX = 0; this.offY = 0;
    this.run(shot, { removeBackground: true, whiteBackground: true, enhance: true, watermark: true, recenter: true, zoom: 1, offsetX: 0, offsetY: 0, force: true });
  }

  private watch(shot: Shot) {
    if (!shot.jobId) return;
    this.polls.get(shot.jobId)?.unsubscribe();
    const tick = () => this.api.studioJob(shot.jobId!).subscribe({
      next: job => {
        shot.status = job.status === 'COMPLETED' ? 'ready' : job.status === 'FAILED' ? 'failed' : 'processing';
        shot.message = job.message || '';
        if (job.asset?.masterUrl || job.asset?.jpegUrl) {
          shot.previewUrl = job.asset.masterUrl || job.asset.jpegUrl;
          shot.catalogUrl = job.asset.catalogUrl || shot.previewUrl;
        }
        if (job.status === 'COMPLETED' || job.status === 'FAILED') {
          this.polls.get(shot.jobId!)?.unsubscribe();
          this.polls.delete(shot.jobId!);
        }
      },
      error: () => { shot.status = 'failed'; shot.message = 'Suivi de tâche interrompu.'; this.polls.get(shot.jobId!)?.unsubscribe(); }
    });
    tick();
    const sub = interval(1200).subscribe(() => tick());
    this.polls.set(shot.jobId, sub);
  }

  validate(shot: Shot, main: boolean) {
    if (!shot.assetId) return;
    this.api.studioConfirm(shot.assetId, { productId: this.productId, main }).subscribe({
      next: a => {
        const url = a.masterUrl || a.jpegUrl;
        if (!url) return;
        const next = this.urls.filter(u => u !== url);
        if (main) next.unshift(url); else next.push(url);
        this.urlsChange.emit(next.slice(0, 12));
        this.hint = main ? 'Photo enregistrée comme image vitrine.' : 'Photo enregistrée dans le catalogue.';
      },
      error: e => this.err = e.error?.message || 'Validation impossible.'
    });
  }

  makeVitrine(s: Shot) {
    const url = this.shotUrl(s);
    if (!url || this.vitrineBusy) return;
    this.shots = [s, ...this.shots.filter(x => x !== s)];
    this.current = 0;
    const next = [url, ...this.urls.filter(u => u !== url)];
    this.urlsChange.emit(next.slice(0, 12));
    this.hint = 'Cette photo est l’image vitrine du produit.';
    if (!this.productId) return;
    this.vitrineBusy = true;
    const done = () => this.vitrineBusy = false;
    const fail = (e: any) => { this.vitrineBusy = false; this.err = e.error?.message || 'Impossible de définir l’image vitrine.'; };
    if (s.assetId) {
      this.api.studioConfirm(s.assetId, { productId: this.productId, main: true }).subscribe({ next: done, error: fail });
      return;
    }
    this.api.setProductVitrine(this.productId, url).subscribe({ next: done, error: fail });
  }

  remove(i: number) {
    const s = this.shots[i];
    if (s.assetId) this.api.studioDelete(s.assetId).subscribe({ error: () => {} });
    const url = s.previewUrl;
    this.shots = this.shots.filter((_, idx) => idx !== i);
    this.urlsChange.emit(this.urls.filter(u => u !== url));
  }

  lookup(code: string) {
    this.lastCode = code;
    this.api.studioLookup(code).subscribe({
      next: r => { this.found = r; this.hint = r.owned ? 'Produit déjà au catalogue.' : 'Produit trouvé.'; },
      error: () => { this.found = null; }
    });
  }
  useFound() { if (this.found) this.productPrefill.emit(this.found); }

  async startLiveCam() {
    this.err = '';
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      this.live = true;
      setTimeout(() => {
        const v = document.querySelector('.live video') as HTMLVideoElement | null;
        if (v) v.srcObject = this.stream!;
      }, 40);
    } catch {
      this.err = 'Caméra indisponible. Utilisez Photographier ou importez une image.';
    }
  }
  captureLive() {
    const v = document.querySelector('.live video') as HTMLVideoElement | null;
    if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    c.toBlob(blob => {
      if (!blob) return;
      this.addFiles([new File([blob], 'capture.jpg', { type: 'image/jpeg' })]);
      this.stopLive();
    }, 'image/jpeg', 0.92);
  }
  stopLive() {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = undefined;
    this.live = false;
  }
}
