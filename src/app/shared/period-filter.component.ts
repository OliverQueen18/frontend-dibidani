import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {PERIOD_PRESETS, PeriodPreset, PeriodRange, formatPeriodLabel, rangeFor} from '../core/period';

@Component({
  selector: 'app-period-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<section class="period" aria-label="Filtrer par période">
  <div class="period-top">
    <span class="period-kicker">Période</span>
    <span class="period-chip">{{label}}</span>
  </div>
  <div class="period-track" role="tablist">
    <button type="button" *ngFor="let p of presets" role="tab" [attr.aria-selected]="range.key===p.key"
      [class.on]="range.key===p.key" (click)="choose(p.key)">
      <i [attr.data-key]="p.key">{{p.icon}}</i>
      <span>{{p.label}}</span>
    </button>
  </div>
  <div class="period-custom" *ngIf="range.key==='custom'">
    <label>
      <span>Du</span>
      <input type="date" [ngModel]="range.from" (ngModelChange)="setCustom($event, range.to)">
    </label>
    <span class="period-dash" aria-hidden="true"></span>
    <label>
      <span>Au</span>
      <input type="date" [ngModel]="range.to" (ngModelChange)="setCustom(range.from, $event)">
    </label>
  </div>
</section>
`,
  styles: [`
.period{background:linear-gradient(180deg,#fff 0%,#f7fbf8 100%);border:1px solid #dce8e2;border-radius:18px;padding:14px 16px 16px;margin-bottom:16px;box-shadow:0 10px 28px rgba(10,48,38,.06)}
.period-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;flex-wrap:wrap}
.period-kicker{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#6a7c75}
.period-chip{display:inline-flex;align-items:center;gap:8px;background:#0a3026;color:#fff;border-radius:999px;padding:6px 12px 6px 10px;font-size:12px;font-weight:700;box-shadow:0 6px 16px rgba(10,48,38,.18)}
.period-chip:before{content:'';width:7px;height:7px;border-radius:50%;background:#ff7900;box-shadow:0 0 0 3px rgba(255,121,0,.25)}
.period-track{display:flex;flex-wrap:nowrap;gap:6px;padding:5px;background:#eef5f1;border-radius:14px;overflow-x:auto}
.period-track button{display:inline-flex;align-items:center;gap:8px;border:0;background:transparent;color:#2c463d;border-radius:999px;padding:8px 14px;cursor:pointer;font:inherit;font-size:13px;font-weight:700;white-space:nowrap;flex:0 0 auto;transition:background .18s ease,color .18s ease,box-shadow .18s ease,transform .18s ease}
.period-track button i{display:grid;place-items:center;min-width:22px;height:22px;border-radius:7px;background:#fff;color:#087a47;font-size:11px;font-style:normal;font-weight:800;box-shadow:0 1px 0 rgba(10,48,38,.06)}
.period-track button i[data-key='today']{font-size:13px;color:#ff7900}
.period-track button:hover{background:#fff;color:#0a3026;transform:translateY(-1px)}
.period-track button.on{background:linear-gradient(135deg,#10a663,#087a47);color:#fff;box-shadow:0 8px 18px rgba(8,122,71,.28)}
.period-track button.on i{background:rgba(255,255,255,.18);color:#fff;box-shadow:none}
.period-track button.on i[data-key='today']{color:#ffd7b0}
.period-custom{display:flex;align-items:end;gap:10px;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px dashed #d5e3dc}
.period-custom label{display:flex;flex-direction:column;gap:5px;min-width:150px;flex:1;font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#6a7c75}
.period-custom input[type=date]{border:1px solid #d7e2de;border-radius:12px;padding:10px 12px;font:inherit;font-size:14px;font-weight:700;color:#0a3026;background:#fff;min-height:44px;box-shadow:inset 0 1px 0 #fff}
.period-custom input[type=date]:focus{outline:2px solid #087a47;outline-offset:1px;border-color:#087a47}
.period-dash{width:18px;height:2px;margin-bottom:21px;border-radius:2px;background:#c5ddd2}
@media(max-width:720px){
  .period{padding:12px}
  .period-track{gap:4px}
  .period-track button{padding:9px 12px}
  .period-dash{display:none}
}
`]
})
export class PeriodFilterComponent implements OnInit {
  @Input() initial: PeriodPreset = '30d';
  @Output() periodChange = new EventEmitter<PeriodRange>();
  presets = PERIOD_PRESETS;
  range: PeriodRange = rangeFor('30d');
  get label() { return formatPeriodLabel(this.range.from, this.range.to, this.range.key); }

  ngOnInit() {
    this.range = rangeFor(this.initial);
    this.periodChange.emit(this.range);
  }

  choose(key: PeriodPreset) {
    this.range = rangeFor(key, this.range.from, this.range.to);
    this.periodChange.emit(this.range);
  }

  setCustom(from: string, to: string) {
    if (!from || !to) return;
    this.range = rangeFor('custom', from, to);
    this.periodChange.emit(this.range);
  }
}
