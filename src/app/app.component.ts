import {Component,OnInit} from '@angular/core';
import {RouterOutlet,Router,NavigationEnd} from '@angular/router';
import {CommonModule} from '@angular/common';
import {filter} from 'rxjs';
import {HeaderComponent} from './shared/header.component';
import {FooterComponent} from './shared/footer.component';
import {ChatbotComponent} from './shared/chatbot.component';

@Component({
  selector:'app-root',
  standalone:true,
  imports:[CommonModule,RouterOutlet,HeaderComponent,FooterComponent,ChatbotComponent],
  template:`<app-header *ngIf="!admin"></app-header><router-outlet></router-outlet><app-footer *ngIf="!admin"></app-footer><app-chatbot *ngIf="!admin"></app-chatbot>`
})
export class AppComponent implements OnInit {
  admin=false;
  constructor(private router:Router){}
  ngOnInit(){
    this.admin=this.router.url.startsWith('/admin');
    this.router.events.pipe(filter(e=>e instanceof NavigationEnd)).subscribe(()=>this.admin=this.router.url.startsWith('/admin'));
  }
}