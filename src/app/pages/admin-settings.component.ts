import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ApiService} from '../core/api.service';
import {SettingsService} from '../core/settings.service';
import {ADMIN_PAGE_STYLES} from './admin-ui';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page">
  <header><div><h1>Paramètres boutique</h1><p>Coordonnées, livraison et réseaux sociaux — visibles immédiatement sur le site.</p></div></header>
  <p class="msg" *ngIf="msg">{{msg}}</p><p class="err" *ngIf="err">{{err}}</p>
  <form class="card" (submit)="$event.preventDefault(); save()">
    <h2>Identité</h2>
    <label>Nom<input [(ngModel)]="form.name" name="name" required></label>
    <label>Slogan<input [(ngModel)]="form.slogan" name="slogan"></label>
    <label>Téléphone<input [(ngModel)]="form.phone" name="phone"></label>
    <label>WhatsApp<input [(ngModel)]="form.whatsapp" name="whatsapp"></label>
    <label>E-mail<input [(ngModel)]="form.email" name="email"></label>
    <label>Ville<input [(ngModel)]="form.city" name="city"></label>
    <label class="full">Adresse<input [(ngModel)]="form.address" name="address"></label>
    <label>Horaires<input [(ngModel)]="form.openingHours" name="openingHours"></label>
    <label>Frais de livraison<input [(ngModel)]="form.deliveryFee" name="deliveryFee"></label>
    <label>Seuil livraison offerte<input [(ngModel)]="form.freeDeliveryThreshold" name="freeDeliveryThreshold"></label>
    <label class="full">Adresse retrait<input [(ngModel)]="form.pickupAddress" name="pickupAddress"></label>
    <label>Horaires retrait<input [(ngModel)]="form.pickupHours" name="pickupHours"></label>
    <label class="full">Virement bancaire<textarea [(ngModel)]="form.bankTransferDetails" name="bankTransferDetails"></textarea></label>
    <h2 class="full">Réseaux sociaux</h2>
    <p class="muted full">Les icônes du site se gèrent aussi dans Contenu → Réseaux sociaux (affichage, ordre, masquage).</p>
    <label>Facebook<input [(ngModel)]="form.facebookUrl" name="facebookUrl" placeholder="https://www.facebook.com/…"></label>
    <label>Instagram<input [(ngModel)]="form.instagramUrl" name="instagramUrl" placeholder="https://www.instagram.com/…"></label>
    <label>TikTok<input [(ngModel)]="form.tiktokUrl" name="tiktokUrl" placeholder="https://www.tiktok.com/@"></label>
    <label>YouTube<input [(ngModel)]="form.youtubeUrl" name="youtubeUrl" placeholder="https://www.youtube.com/@"></label>
    <label>LinkedIn<input [(ngModel)]="form.linkedinUrl" name="linkedinUrl" placeholder="https://www.linkedin.com/…"></label>
    <div class="actions"><button class="btn" [disabled]="busy">Enregistrer</button></div>
  </form>
  <form class="card" (submit)="$event.preventDefault(); saveStudio()">
    <h2 class="full">Studio photo</h2>
    <p class="muted full">Signature Dibidani apposée sur les photos produits. Moteur : {{studio.processorUp ? 'opérationnel' : 'repli local (sans détourage IA)'}}.</p>
    <label>Moteur
      <select [(ngModel)]="studio.engine" name="engine">
        <option value="local">Local (OpenCV)</option>
        <option value="rembg">Local rembg</option>
        <option value="api">API externe</option>
      </select>
    </label>
    <label class="check"><input type="checkbox" [(ngModel)]="studio.watermarkEnabled" name="wmOn"> Signature active</label>
    <label>Position
      <select [(ngModel)]="studio.watermarkPosition" name="wmPos">
        <option>BOTTOM_RIGHT</option><option>BOTTOM_LEFT</option><option>TOP_RIGHT</option><option>TOP_LEFT</option>
      </select>
    </label>
    <label>Taille (0.06 = 6 %)<input type="number" step="0.01" min="0.03" max="0.18" [(ngModel)]="studio.watermarkSize" name="wmSize"></label>
    <label>Opacité<input type="number" step="0.05" min="0.2" max="1" [(ngModel)]="studio.watermarkOpacity" name="wmOp"></label>
    <label>Marge<input type="number" step="0.005" min="0.01" max="0.08" [(ngModel)]="studio.watermarkMargin" name="wmMg"></label>
    <label>Cadrage produit<input type="number" step="0.01" min="0.55" max="0.92" [(ngModel)]="studio.fillRatio" name="fill"></label>
    <label class="check"><input type="checkbox" [(ngModel)]="studio.shadowEnabled" name="shadow"> Ombre douce</label>
    <div class="actions"><button class="btn" [disabled]="studioBusy">Enregistrer le studio</button></div>
  </form>
</div>`,
  styles: [ADMIN_PAGE_STYLES]
})
export class AdminSettingsComponent implements OnInit {
  form: any = {}; studio: any = {}; busy = false; studioBusy = false; msg = ''; err = '';
  constructor(private api: ApiService, private settings: SettingsService) {}
  ngOnInit() {
    this.api.shopSettings().subscribe(s => this.form = {...s});
    this.api.photoStudioSettings().subscribe({next: s => this.studio = {...s}, error: () => this.studio = {engine:'local', watermarkEnabled:true}});
  }
  save() {
    this.busy = true; this.msg = ''; this.err = '';
    this.api.saveShopSettings(this.form).subscribe({
      next: s => { this.busy = false; this.form = {...s}; this.msg = 'Paramètres enregistrés. Le site public est à jour.'; this.settings.reload(); },
      error: e => { this.busy = false; this.err = e.error?.message || 'Impossible.'; }
    });
  }
  saveStudio() {
    this.studioBusy = true; this.msg = ''; this.err = '';
    this.api.savePhotoStudioSettings(this.studio).subscribe({
      next: s => { this.studioBusy = false; this.studio = {...s}; this.msg = 'Réglages du studio photo enregistrés.'; },
      error: e => { this.studioBusy = false; this.err = e.error?.message || 'Studio impossible à enregistrer.'; }
    });
  }
}
