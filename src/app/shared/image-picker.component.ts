import { AfterViewChecked, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/api.service';
import { uploadErrorMessage } from '../core/image-upload';

type Media = { url: string; name: string; bytes: number; modified: string };

@Component({
  selector: 'app-image-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="pick" *ngIf="embed">
  <button type="button" class="btn ghost" (click)="open()">{{url ? 'Changer l’image' : 'Bibliothèque'}}</button>
  <img *ngIf="url" class="preview" [src]="url" alt="">
  <button type="button" class="clear" *ngIf="url" (click)="clear()">Retirer</button>
</div>

<div class="scrim" *ngIf="shown" #overlay (click)="close()">
  <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="lib-title" (click)="$event.stopPropagation()">
    <header>
      <div>
        <h2 id="lib-title">Bibliothèque d’images</h2>
        <p>Choisissez une image déjà envoyée, ou téléversez-en une nouvelle.</p>
      </div>
      <button type="button" class="x" (click)="close()" aria-label="Fermer">×</button>
    </header>
    <div class="bar">
      <label class="btn">Téléverser
        <input type="file" accept="image/*" hidden (change)="upload($event)">
      </label>
      <span class="muted" *ngIf="busy">Chargement…</span>
      <span class="muted" *ngIf="!busy">{{items.length}} image{{items.length>1 ? 's' : ''}}</span>
    </div>
    <p class="err" *ngIf="err">{{err}}</p>
    <p class="muted empty" *ngIf="!busy && !items.length">Aucune image pour l’instant. Téléversez la première.</p>
    <div class="grid">
      <article *ngFor="let m of items" [class.on]="m.url===url">
        <button type="button" class="thumb" (click)="choose(m)" [attr.aria-label]="'Choisir ' + m.name">
          <img [src]="m.url" [alt]="m.name">
        </button>
        <button type="button" class="del" (click)="remove(m)" aria-label="Supprimer">Supprimer</button>
      </article>
    </div>
  </section>
</div>
`,
  styles: [`
.pick{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.preview{height:56px;max-width:160px;object-fit:contain;background:#f4f8f6;border:1px solid #e7edeb;border-radius:8px;padding:4px}
.clear{border:0;background:transparent;color:#b42318;font-size:12px;cursor:pointer;font-weight:700}
.btn{background:#087a47;color:#fff;border:0;border-radius:8px;padding:8px 12px;font-weight:700;cursor:pointer;font:inherit}
.btn.ghost{background:#fff;color:#087a47;border:1px solid #c5ddd2}
.scrim{position:fixed;inset:0;background:#00150db8;z-index:220;display:grid;place-items:center;padding:16px}
.sheet{background:#fff;width:min(920px,100%);max-height:min(86vh,760px);border-radius:16px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px #0004;min-height:0}
.sheet header{display:flex;justify-content:space-between;gap:12px;padding:16px 18px 8px;align-items:flex-start;flex-shrink:0}
.sheet h2{margin:0;font-size:18px;color:#173b30}
.sheet header p{margin:4px 0 0;color:#6a7c75;font-size:13px}
.x{border:0;background:#eaf4ef;width:36px;height:36px;border-radius:50%;font-size:22px;cursor:pointer;line-height:1;flex-shrink:0}
.bar{display:flex;align-items:center;gap:12px;padding:0 18px 12px;flex-wrap:wrap;flex-shrink:0}
.bar .btn{display:inline-flex}
.muted{color:#6a7c75;font-size:13px}
.err{color:#b42318;font-size:13px;margin:0 18px 8px}
.empty{margin:0 18px 16px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:10px;padding:0 18px 18px;overflow:auto;flex:1;min-height:0;-webkit-overflow-scrolling:touch}
article{border:2px solid #e7edeb;border-radius:12px;overflow:hidden;background:#f7faf8;display:flex;flex-direction:column}
article.on{border-color:#087a47}
.thumb{border:0;background:#fff;padding:0;cursor:pointer;aspect-ratio:1;display:grid;place-items:center}
.thumb img{width:100%;height:100%;object-fit:cover}
.del{border:0;background:#fff;color:#b42318;font-size:11px;font-weight:700;padding:7px 8px;cursor:pointer;border-top:1px solid #edf1ef}
@media(max-width:600px){
  .scrim{padding:0;place-items:stretch}
  .sheet{width:100%;height:100%;max-height:100%;border-radius:0}
  .grid{grid-template-columns:repeat(2,minmax(0,1fr));padding:0 12px max(16px,env(safe-area-inset-bottom))}
  .sheet header,.bar{padding-left:12px;padding-right:12px}
}
`]
})
export class ImagePickerComponent implements AfterViewChecked, OnDestroy {
  @Input() url = '';
  @Input() embed = true;
  @Output() urlChange = new EventEmitter<string>();
  @ViewChild('overlay') overlay?: ElementRef<HTMLElement>;
  shown = false;
  busy = false;
  err = '';
  items: Media[] = [];

  constructor(private api: ApiService) {}

  ngAfterViewChecked() {
    const el = this.overlay?.nativeElement;
    if (el && el.parentElement !== document.body) document.body.appendChild(el);
  }

  ngOnDestroy() {
    this.overlay?.nativeElement.remove();
  }

  @HostListener('document:keydown.escape')
  onEsc() { if (this.shown) this.close(); }

  open() {
    this.shown = true;
    this.err = '';
    this.load();
  }
  close() { this.shown = false; }
  clear() { this.urlChange.emit(''); }

  choose(m: Media) {
    this.urlChange.emit(m.url);
    this.close();
  }

  load() {
    this.busy = true;
    this.api.mediaLibrary().subscribe({
      next: rows => { this.items = rows || []; this.busy = false; },
      error: e => { this.busy = false; this.err = e.error?.message || 'Bibliothèque indisponible.'; }
    });
  }

  upload(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.err = '';
    this.busy = true;
    this.api.upload(file).subscribe({
      next: r => {
        this.busy = false;
        input.value = '';
        this.urlChange.emit(r.url);
        this.close();
        this.load();
      },
      error: e => {
        this.busy = false;
        input.value = '';
        this.err = uploadErrorMessage(e);
      }
    });
  }

  remove(m: Media) {
    if (!confirm('Supprimer cette image de la bibliothèque ? Les contenus qui l’utilisent devront en choisir une autre.')) return;
    this.api.deleteMedia(m.url).subscribe({
      next: () => {
        this.items = this.items.filter(x => x.url !== m.url);
        if (this.url === m.url) this.urlChange.emit('');
      },
      error: e => this.err = e.error?.message || 'Suppression impossible.'
    });
  }
}
