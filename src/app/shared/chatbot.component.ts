import { Component, ElementRef, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AssistantReply, AssistantService } from '../core/assistant.service';
import { CartService } from '../core/cart.service';
import { Product } from '../core/models';

interface Msg { from: 'bot' | 'user'; text: string; products?: Product[]; suggestions?: string[] }

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <button class="fab" type="button" (click)="toggle()" [attr.aria-expanded]="open()" aria-label="Assistant Dibidani">
      <img *ngIf="!open()" src="assets/logo-dibidani.png" alt="">
      <span *ngIf="open()">✕</span>
    </button>
    <section class="panel" *ngIf="open()" role="dialog" aria-label="Assistant Dibidani">
      <header>
        <img src="assets/logo-dibidani.png" alt="Dibidani">
        <div>
          <b>Assistant Dibidani</b>
          <small>Recherche écrite ou vocale, jusqu'à la commande</small>
        </div>
        <button type="button" class="x" (click)="toggle()" aria-label="Fermer">✕</button>
      </header>
      <div class="thread" #thread>
        <div class="msg" *ngFor="let m of messages()" [class.me]="m.from==='user'">
          <p>{{m.text}}</p>
          <div class="hits" *ngIf="m.products?.length">
            <article *ngFor="let p of m.products">
              <img [src]="p.mainImageUrl || 'assets/product-placeholder.svg'" [alt]="p.name">
              <div>
                <b>{{p.name}}</b>
                <span>FCFA {{(p.promoPrice ?? p.price).toLocaleString('fr-FR')}}</span>
                <button type="button" (click)="add(p)">Ajouter au panier</button>
              </div>
            </article>
          </div>
          <div class="chips" *ngIf="m.suggestions?.length">
            <button type="button" *ngFor="let s of m.suggestions" (click)="send(s)">{{s}}</button>
          </div>
        </div>
        <p class="wait" *ngIf="busy()">Dibidani réfléchit…</p>
      </div>
      <div class="interim" *ngIf="interim()">🎤 {{interim()}}</div>
      <form class="bar" (submit)="$event.preventDefault(); send()">
        <input [(ngModel)]="draft" name="q" [placeholder]="listening() ? 'Parlez…' : 'Écrire ou parler…'" autocomplete="off">
        <button type="button" class="mic" [class.on]="listening()" (click)="voice()" [attr.aria-pressed]="listening()" [title]="voiceTitle">{{listening() ? '■' : '🎤'}}</button>
        <button type="submit" class="go" [disabled]="busy()">➤</button>
      </form>
    </section>
  `,
  styles: [`
    :host{position:fixed;right:18px;bottom:18px;z-index:80;font-family:inherit}
    .fab{width:58px;height:58px;border:0;border-radius:50%;background:#fff;color:#087a47;font-size:22px;box-shadow:0 10px 28px #087a4766;cursor:pointer;padding:6px;overflow:hidden;display:grid;place-items:center}
    .fab img{width:100%;height:100%;object-fit:contain;display:block}
    .panel{position:absolute;right:0;bottom:70px;width:min(380px,calc(100vw - 24px));height:min(560px,70vh);background:#fff;border:1px solid #dce6e2;border-radius:18px;box-shadow:0 18px 50px #082f2426;display:flex;flex-direction:column;overflow:hidden}
    header{display:grid;grid-template-columns:44px 1fr auto;gap:10px;align-items:center;background:#087a47;color:#fff;padding:12px 14px}
    header img{width:44px;height:44px;object-fit:contain;background:#fff;border-radius:10px;padding:3px}
    header small{display:block;opacity:.85;font-size:11px;margin-top:2px}
    header .x{border:0;background:transparent;color:#fff;font-size:18px;cursor:pointer}
    .thread{flex:1;overflow:auto;padding:12px;background:#f4f8f6;display:flex;flex-direction:column;gap:10px}
    .msg{max-width:95%;background:#fff;border:1px solid #e3ebe8;border-radius:14px 14px 14px 4px;padding:10px 12px}
    .msg.me{align-self:flex-end;background:#087a47;color:#fff;border-color:#087a47;border-radius:14px 14px 4px 14px}
    .msg p{margin:0;font-size:13px;line-height:1.4}
    .hits{display:flex;flex-direction:column;gap:8px;margin-top:10px}
    .hits article{display:grid;grid-template-columns:56px 1fr;gap:8px;background:#f8fbfa;border-radius:10px;padding:8px;color:#173c31}
    .hits img{width:56px;height:56px;object-fit:contain;background:#fff;border-radius:8px}
    .hits b{display:block;font-size:12px}
    .hits span{display:block;color:#eb3b18;font-size:12px;font-weight:800;margin:3px 0}
    .hits button{border:0;background:#087a47;color:#fff;border-radius:6px;padding:6px 8px;font-size:11px;font-weight:700;cursor:pointer}
    .chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
    .chips button{border:1px solid #cfe0d8;background:#fff;color:#087a47;border-radius:999px;padding:5px 10px;font-size:11px;cursor:pointer}
    .wait{color:#73837d;font-size:12px}
    .interim{padding:4px 12px;font-size:12px;color:#087a47;background:#eef9f3}
    .bar{display:flex;gap:6px;padding:10px;border-top:1px solid #e3ebe8;background:#fff}
    .bar input{flex:1;border:1px solid #dce5e1;border-radius:10px;padding:10px}
    .mic,.go{width:42px;border:0;border-radius:10px;font-size:16px;cursor:pointer}
    .mic{background:#eef9f3}
    .mic.on{background:#ff7900;color:#fff}
    .go{background:#ff7900;color:#fff;font-weight:800}
    @media(max-width:600px){.panel{height:min(72vh,620px)}}
  `]
})
export class ChatbotComponent implements OnInit {
  @ViewChild('thread') thread?: ElementRef<HTMLElement>;
  open = signal(false);
  busy = signal(false);
  listening = signal(false);
  interim = signal('');
  draft = '';
  messages = signal<Msg[]>([{
    from: 'bot',
    text: 'Bienvenue chez Dibidani ! Je suis votre assistant. Dites-moi un produit à l\'écrit ou au micro, je cherche, je l\'ajoute au panier et je vous emmène jusqu\'à la commande.',
    suggestions: ['Je cherche une perceuse', 'Riz 50 kg', 'Voir le panier', 'Passer commande']
  }]);
  lastIds: number[] = [];
  voiceTitle = 'Parler';
  private rec: any;
  private fromVoice = false;

  ngOnInit() {
    this.open.set(true);
    setTimeout(() => this.scroll(), 50);
  }

  constructor(private assistant: AssistantService, private cart: CartService, private router: Router) {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      this.rec = new SR();
      this.rec.lang = 'fr-FR';
      this.rec.interimResults = true;
      this.rec.continuous = false;
      this.rec.onresult = (e: any) => {
        let final = '';
        let live = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += t;
          else live += t;
        }
        this.interim.set(live);
        if (final.trim()) {
          this.draft = final.trim();
          this.interim.set('');
          this.send(final.trim(), true);
        }
      };
      this.rec.onerror = () => this.stopVoice();
      this.rec.onend = () => {
        const leftover = (this.interim() || this.draft).trim();
        this.listening.set(false);
        this.interim.set('');
        if (leftover && !this.busy()) this.send(leftover, true);
      };
    } else {
      this.voiceTitle = 'Micro non disponible sur ce navigateur';
    }
  }

  toggle() { this.open.update(v => !v); if (this.open()) setTimeout(() => this.scroll(), 50); }

  send(text?: string, viaVoice = false) {
    const message = (text ?? this.draft).trim();
    if (!message || this.busy()) return;
    this.fromVoice = viaVoice;
    this.draft = '';
    this.stopVoice();
    this.messages.update(m => [...m, { from: 'user', text: message }]);
    this.busy.set(true);
    this.scroll();
    this.assistant.chat(message, this.cart.count(), this.lastIds).subscribe({
      next: r => this.apply(r),
      error: () => { this.busy.set(false); this.push('Je n\'ai pas pu répondre. Réessayez.'); }
    });
  }

  add(p: Product) {
    this.cart.add(p);
    this.lastIds = [p.id, ...this.lastIds.filter(id => id !== p.id)].slice(0, 8);
    this.push(`« ${p.name} » est dans le panier (${this.cart.count()} article(s)). Dites « commande » pour payer.`, ['Passer commande', 'Voir le panier']);
  }

  voice() {
    if (!this.rec) { this.push('La dictée vocale n\'est pas disponible. Utilisez Chrome ou Edge, ou tapez votre recherche.'); return; }
    if (this.listening()) { this.stopVoice(); return; }
    this.open.set(true);
    this.fromVoice = true;
    speechSynthesis?.cancel();
    this.listening.set(true);
    this.interim.set('');
    try { this.rec.start(); } catch { this.listening.set(false); }
  }

  private apply(r: AssistantReply) {
    this.busy.set(false);
    if (r.products?.length) this.lastIds = r.products.map(p => p.id);
    this.messages.update(m => [...m, { from: 'bot', text: r.reply, products: r.products, suggestions: r.suggestions }]);
    this.speak(r.reply);
    if (r.action?.type === 'ADD_TO_CART' && r.action.productId) {
      const p = r.products.find(x => x.id === r.action!.productId) || r.products[0];
      if (p) this.cart.add(p, r.action.quantity || 1);
    }
    if (r.action?.type === 'NAVIGATE' && r.action.path) {
      setTimeout(() => this.router.navigateByUrl(r.action!.path!), 450);
    }
    this.fromVoice = false;
    this.scroll();
  }

  private push(text: string, suggestions?: string[]) {
    this.messages.update(m => [...m, { from: 'bot', text, suggestions }]);
    this.scroll();
  }

  private speak(text: string) {
    if (!this.fromVoice || !('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR';
    u.rate = 1.02;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  private stopVoice() {
    this.listening.set(false);
    this.interim.set('');
    try { this.rec?.stop(); } catch {}
  }

  private scroll() {
    setTimeout(() => {
      const el = this.thread?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 30);
  }
}
