/* Brand Concepts Limited — click any column heading to sort a table.
   1st click: largest first (numbers) / A→Z (text) · 2nd click: reverse · 3rd click: original order.
   Total rows stay in place; tree rows (PP/PC → styles, brand → items) move with their parent.
   Tables that already have their own sorting (a heading with onclick) are left alone. */
(function(){
  const css=document.createElement('style');
  css.textContent=
    'th.ts-on{cursor:pointer;user-select:none;-webkit-user-select:none}'+
    'th.ts-on:hover{color:var(--text,#1d1d1f)}'+
    '.ts-ar{display:inline-block;width:.9em;margin-left:3px;font-size:.85em;opacity:0;color:var(--blue,#0071e3)}'+
    'th.ts-on:hover .ts-ar{opacity:.45}'+
    'th.ts-act .ts-ar{opacity:1!important}';
  document.head.appendChild(css);

  const STATE={};            // header signature -> {col,dir}
  const FIXED=/\b(tot|total|gtot|grandtotal|grand-total|total-row|subtotal|sub-total|ttl)\b/i;
  const MON={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};

  const skip=t=>!t.tHead||!t.tBodies.length||t.closest('[data-nosort]')||t.querySelector('thead th[onclick]');
  const hText=th=>{let s='';th.childNodes.forEach(n=>{if(!(n.classList&&n.classList.contains('ts-ar')))s+=n.textContent;});return s.trim();};
  const sig=t=>[...t.tHead.rows].map(r=>[...r.cells].map(hText).join('|')).join('#')+'@'+(t.id||'');

  // column start index of every heading cell (handles colspan / rowspan)
  function headMap(t){
    const rows=[...t.tHead.rows],grid=[],map=new Map();let width=0;
    rows.forEach((r,ri)=>{grid[ri]=grid[ri]||[];let c=0;
      [...r.cells].forEach(th=>{while(grid[ri][c])c++;const cs=th.colSpan||1,rs=th.rowSpan||1;
        for(let y=0;y<rs;y++){grid[ri+y]=grid[ri+y]||[];for(let x=0;x<cs;x++)grid[ri+y][c+x]=1;}
        if(ri+rs===rows.length&&cs===1)map.set(th,c);   // sortable only if it reaches the bottom header row and spans one column
        c+=cs;width=Math.max(width,c);});});
    return {map,width};
  }
  function cellAt(tr,col){let c=0;for(const td of tr.cells){const cs=td.colSpan||1;if(col<c+cs)return cs===1?td:null;c+=cs;}return null;}

  function parse(txt){
    let s=(txt||'').replace(/ /g,' ').trim();
    if(!s||/^[-–—]+$/.test(s)||/^(n\/?a|nil)$/i.test(s))return {e:1};
    let m=s.match(/^(\d{1,2})[-\s/]([A-Za-z]{3})[a-z]*[-\s/,]*(\d{2,4})$/);
    if(m&&MON[m[2].toLowerCase()]!=null){let y=+m[3];if(y<100)y+=2000;return {n:new Date(y,MON[m[2].toLowerCase()],+m[1]).getTime(),d:1};}
    m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return {n:new Date(+m[1],+m[2]-1,+m[3]).getTime(),d:1};
    m=s.match(/^([A-Za-z]{3})[a-z]*[-\s'’]+(\d{2,4})$/);
    if(m&&MON[m[1].toLowerCase()]!=null){let y=+m[2];if(y<100)y+=2000;return {n:new Date(y,MON[m[1].toLowerCase()],1).getTime(),d:1};}
    let neg=/^\(.*\)$/.test(s);
    let t=s.replace(/[₹$,\s]|^\(|\)$/g,'').replace(/^rs\.?/i,'');
    m=t.match(/^([-+]?\d*\.?\d+)(cr|crore|l|lac|lakh|lakhs|k|m|mn|%|x|d|days?)?$/i);
    if(m){let v=parseFloat(m[1]);const u=(m[2]||'').toLowerCase();
      if(u.startsWith('cr'))v*=1e7;else if(u.startsWith('l'))v*=1e5;else if(u==='k')v*=1e3;else if(u==='m'||u==='mn')v*=1e6;
      return {n:neg?-v:v};}
    return {s:s};
  }
  const depth=tr=>{if(tr.classList.contains('sub')||tr.classList.contains('child')||tr.classList.contains('detail'))return 1;
    for(const c of tr.classList){const m=c.match(/^l(\d)$/);if(m)return +m[1];}return 0;};
  const isFixed=tr=>FIXED.test(tr.className)||/^(grand\s*)?(total|ttl)\b/i.test((tr.cells[0]&&tr.cells[0].textContent||'').trim())||/\btotal$/i.test((tr.cells[0]&&tr.cells[0].textContent||'').trim());

  function apply(t,st){
    const {map,width}=headMap(t);
    t.querySelectorAll('thead th').forEach(th=>{
      if(!map.has(th)||th.classList.contains('gap'))return;
      th.classList.add('ts-on');
      let ar=th.querySelector('.ts-ar');if(!ar){ar=document.createElement('span');ar.className='ts-ar';th.appendChild(ar);}
      const on=st&&map.get(th)===st.col;th.classList.toggle('ts-act',!!on);
      const want=on?(st.dir<0?'▼':'▲'):'↕';if(ar.textContent!==want)ar.textContent=want;
    });
    for(const tb of t.tBodies){
      const rows=[...tb.rows];if(rows.length<2)continue;
      rows.forEach((r,i)=>{if(r.dataset.tso==null)r.dataset.tso=i;});
      // segments split by total rows and full-width (colspan) heading rows
      const segs=[];let cur=[];
      const flush=()=>{if(cur.length)segs.push(cur);cur=[];};
      const out=[];
      rows.forEach(r=>{if(isFixed(r)||(r.cells.length===1&&width>1)){flush();segs.push(r);}else cur.push(r);});
      flush();
      let type=null;
      if(st){const vals=[];rows.forEach(r=>{const c=cellAt(r,st.col);if(c)vals.push(parse(c.textContent));});
        const ne=vals.filter(v=>!v.e);type=ne.length&&ne.filter(v=>v.n!=null).length>=ne.length*0.6?'n':'s';}
      const key=r=>{const c=st?cellAt(r,st.col):null;return c?parse(c.textContent):{e:1};};
      const cmp=(a,b)=>{
        if(!st)return a.dataset.tso-b.dataset.tso;
        const x=key(a),y=key(b);
        if(x.e||y.e)return (x.e?1:0)-(y.e?1:0)||a.dataset.tso-b.dataset.tso;
        let r;
        if(type==='n'&&x.n!=null&&y.n!=null)r=x.n-y.n;
        else if(type==='n')r=(x.n!=null?-1:1)-(y.n!=null?-1:1);
        else r=String(x.s!=null?x.s:x.n).localeCompare(String(y.s!=null?y.s:y.n),undefined,{numeric:true,sensitivity:'base'});
        return r*st.dir||a.dataset.tso-b.dataset.tso;
      };
      const build=(list)=>{ // tree: each row + following deeper rows
        const units=[];let i=0;
        while(i<list.length){const head=list[i],d=depth(head);let j=i+1;while(j<list.length&&depth(list[j])>d)j++;
          units.push({head,kids:list.slice(i+1,j)});i=j;}
        units.sort((a,b)=>cmp(a.head,b.head));
        const res=[];units.forEach(u=>{res.push(u.head);if(u.kids.length)res.push(...build(u.kids));});return res;
      };
      segs.forEach(s=>{if(Array.isArray(s))out.push(...build(s));else out.push(s);});
      let same=out.length===rows.length&&out.every((r,i)=>r===rows[i]);
      if(!same)out.forEach(r=>tb.appendChild(r));
    }
  }

  document.addEventListener('click',e=>{
    const th=e.target.closest('thead th');if(!th)return;
    const t=th.closest('table');if(!t||skip(t))return;
    const {map}=headMap(t);if(!map.has(th)||th.classList.contains('gap'))return;
    const col=map.get(th),k=sig(t),st=STATE[k];
    let numeric=false;for(const tb of t.tBodies)for(const r of tb.rows){const c=cellAt(r,col);if(c){const v=parse(c.textContent);if(!v.e){numeric=v.n!=null;break;}}}
    const first=numeric?-1:1;
    let nx;
    if(!st||st.col!==col)nx={col,dir:first};
    else if(st.dir===first)nx={col,dir:-first};
    else nx=null;
    if(nx)STATE[k]=nx;else delete STATE[k];
    apply(t,nx);
  });

  // keep headings marked and re-apply a chosen sort after a report redraws its table (filters, expand/collapse)
  let pend=false;
  const sweep=()=>{pend=false;document.querySelectorAll('table').forEach(t=>{if(skip(t))return;const st=STATE[sig(t)];
    const marked=t.tHead.querySelector('.ts-ar');if(st||!marked)apply(t,st||null);});};
  new MutationObserver(()=>{if(!pend){pend=true;requestAnimationFrame(sweep);}}).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState!=='loading')sweep();else document.addEventListener('DOMContentLoaded',sweep);
})();
