import {Component} from '@angular/core';import {CommonModule} from '@angular/common';import {FormsModule} from '@angular/forms';import {Router} from '@angular/router';import {CartService} from '../core/cart.service';import {ApiService} from '../core/api.service';import {AuthService} from '../core/auth.service';
@Component({standalone:true,imports:[CommonModule,FormsModule],template:`<main class="container page"><div class="checkout-grid"><section><div class="steps">Panier → <b>Livraison</b> → Paiement → Confirmation</div><h1>Adresse de livraison</h1><label>Adresse complète<input [(ngModel)]="address" placeholder="Ex. Dibidani, Commune IV, Bamako"></label><label>Quartier / Zone<input [(ngModel)]="district" placeholder="Dibidani"></label><label>N° Tél (obligatoire)<input type="tel" required autocomplete="tel" maxlength="25" [(ngModel)]="phone" placeholder="+223 ..."></label><h2>Mode de livraison</h2><div class="option active">● Standard (24h - 48h) <b>2 500 FCFA</b></div><div class="option">○ Express (selon disponibilité) <b>5 000 FCFA</b></div><h2>Mode de paiement</h2><label class="option"><input type="radio" name="pay" [(ngModel)]="method" value="ORANGE_MONEY"> Orange Money</label><label class="option"><input type="radio" name="pay" [(ngModel)]="method" value="MOOV_MONEY"> Moov Money</label><label class="option"><input type="radio" name="pay" [(ngModel)]="method" value="CARD"> Carte bancaire</label><label class="option"><input type="radio" name="pay" [(ngModel)]="method" value="COD"> Paiement à la livraison</label></section><aside><h2>Récapitulatif</h2><div *ngFor="let i of cart.items()" class="mini"><span>{{i.quantity}} × {{i.product.name}}</span><b>{{((i.product.promoPrice??i.product.price)*i.quantity).toLocaleString('fr-FR')}}</b></div><hr><p><span>Sous-total</span><b>{{cart.subtotal().toLocaleString('fr-FR')}} FCFA</b></p><p><span>Livraison</span><b>2 500 FCFA</b></p><p class="total"><span>Total</span><b>{{(cart.subtotal()+2500).toLocaleString('fr-FR')}} FCFA</b></p><p class="note">Nous vérifions ensuite la disponibilité auprès des vendeurs, puis nous vous confirmons la commande.</p><button (click)="submit()" [disabled]="loading">{{loading?'Traitement...':'Passer la commande'}}</button><small *ngIf="message">{{message}}</small></aside></div></main>`,styles:[`.page{padding-top:30px}.checkout-grid{display:grid;grid-template-columns:1fr 380px;gap:24px}.checkout-grid section,.checkout-grid aside{background:#fff;border:1px solid #e3ebe8;border-radius:14px;padding:24px}.steps{color:#73837d;margin-bottom:20px}.steps b{color:#087a47}label{display:block;margin:13px 0;color:#40534c;font-size:13px}label input:not([type=radio]){display:block;width:100%;box-sizing:border-box;padding:12px;border:1px solid #dce5e1;border-radius:8px;margin-top:5px}.option{border:1px solid #dfe7e4;border-radius:9px;padding:13px;margin:9px 0;display:flex;justify-content:space-between}.option.active{border-color:#087a47;background:#eef9f3}.mini,.checkout-grid aside p{display:flex;justify-content:space-between;gap:15px;padding:8px 0;font-size:13px}.total{font-size:20px!important}.checkout-grid aside button{width:100%;background:#ff7900;color:#fff;border:0;border-radius:8px;padding:14px;font-weight:800}.checkout-grid aside .note{color:#5a6d66;font-size:12px;margin:0 0 10px}.checkout-grid aside small{display:block;margin-top:10px;color:#c54d32}@media(max-width:800px){.checkout-grid{grid-template-columns:1fr}}`]
})
export class CheckoutComponent {
  address='Dibidani, Bamako'; district='Dibidani'; phone=''; method='ORANGE_MONEY';
  loading=false; message='';
  private pendingOrder?: import('../core/models').Order;
  constructor(public cart:CartService,private api:ApiService,private auth:AuthService,private router:Router) {}
  submit() {
    if(this.loading) return;
    if(!/^\+?(?=(?:\D*\d){8,15}\D*$)[0-9 ().-]{8,25}$/.test(this.phone.trim())) {
      this.message='Renseignez un numéro de téléphone valide (8 à 15 chiffres).'; return;
    }
    this.phone=this.phone.trim(); this.message='';
    if(!this.auth.token()) { this.router.navigate(['/login'],{queryParams:{returnUrl:'/checkout'}}); return; }
    this.loading=true;
    if (this.pendingOrder) { this.continueOrder(this.pendingOrder); return; }
    this.api.createOrder({items:this.cart.items().map(i=>({productId:i.product.id,quantity:i.quantity})),deliveryAddress:this.address,deliveryDistrict:this.district,customerPhone:this.phone,paymentMethod:this.method}).subscribe({
      next: o => { this.pendingOrder=o; this.continueOrder(o); },
      error: e => { this.loading=false; this.message=e.error?.message||'Commande impossible'; }
    });
  }
  private continueOrder(order: import('../core/models').Order) {
    // A saved offline order (or one already paid/confirmed) needs no online retry.
    if (!['PENDING_PAYMENT','PAYMENT_FAILED'].includes(order.status)
        || ['COD','CASH_ON_DELIVERY','CASH_AT_STORE','BANK_TRANSFER'].includes(order.paymentMethod)) {
      this.finish(order.orderNumber); return;
    }
    this.api.payOrder(order.orderNumber,{phone:this.phone}).subscribe({
      next: result => {
        this.pendingOrder=result.order;
        if(result.nextAction==='RETRY_PAYMENT') { this.loading=false; this.message=result.message; return; }
        if(result.nextAction==='REDIRECT' && result.payment?.checkoutUrl) {
          this.cart.clear(); window.location.assign(result.payment.checkoutUrl); return;
        }
        this.finish(result.order.orderNumber);
      },
      error: e => {
        this.loading=false;
        this.message='Commande '+order.orderNumber+' enregistrée. '+(e.error?.message||'Paiement indisponible. Réessayez pour cette même commande.');
      }
    });
  }
  private finish(number:string) { this.cart.clear(); this.router.navigate(['/confirmation',number]); }
}
