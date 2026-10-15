export const ADMIN_PAGE_STYLES = `
.page{padding:8px 4px 32px}
.page header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px;flex-wrap:wrap}
.page h1{margin:0;font-size:22px}
.page header p,.muted{color:#6a7c75;font-size:13px;margin:4px 0 0}
.page header button,.btn{background:#087a47;color:#fff;border:0;border-radius:8px;padding:8px 12px;font-weight:700;cursor:pointer}
.btn.ghost{background:#fff;color:#087a47;border:1px solid #c5ddd2}
.btn.danger{background:#b42318}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}
.kpis div,.panel,table{background:#fff;border:1px solid #e2e9e6;border-radius:12px}
.kpis div{padding:16px;display:flex;flex-direction:column}
.kpis small{color:#6a7c75}
.kpis b{font-size:22px;margin-top:6px}
.filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.filters input,.filters select,form input,form select,form textarea{
  border:1px solid #d7e2de;border-radius:8px;padding:8px 10px;font:inherit;background:#fff}
.filters button{border:1px solid #d7e2de;background:#fff;color:#173b30;border-radius:8px;padding:8px 12px;cursor:pointer;font-weight:700}
.filters button.on,.filters button.btn{background:#087a47;color:#fff;border-color:#087a47}
table{width:100%;border-collapse:collapse;overflow:hidden}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid #edf1ef;font-size:13px;vertical-align:middle}
th{font-size:11px;text-transform:uppercase;color:#6a7c75}
.tag{background:#e8f7ef;color:#087a47;padding:3px 7px;border-radius:5px;font-size:11px;font-weight:700}
.tag.off{background:#fdecea;color:#b42318}
.row-actions{display:flex;gap:6px;flex-wrap:wrap}
.row-actions button{border:0;background:#eaf4ef;color:#0a3026;border-radius:6px;padding:5px 8px;cursor:pointer;font-size:12px}
.row-actions button:disabled{opacity:.45;cursor:wait}
form.card{background:#fff;border:1px solid #e2e9e6;border-radius:12px;padding:16px;margin-bottom:16px;display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
form.card h2{grid-column:1/-1;margin:0;font-size:16px}
form.card label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#4c5e57}
form.card .full{grid-column:1/-1}
form.card textarea{min-height:90px}
form.card .actions{grid-column:1/-1;display:flex;gap:8px;align-items:center}
.msg{color:#087a47;font-size:13px}.err{color:#b42318;font-size:13px}
.detail{background:#fff;border:1px solid #e2e9e6;border-radius:12px;padding:16px;margin-top:14px}
@media(max-width:900px){
  .kpis{grid-template-columns:1fr 1fr}
  form.card{grid-template-columns:1fr}
  .page{overflow:auto}
  .page header{align-items:stretch}
  .page h1{font-size:20px}
  table{min-width:620px}
}
`;
