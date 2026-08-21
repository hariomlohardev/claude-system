/* app.js — single source from updated DESIGN.md §11, §19.3/19.4 — vanilla, respects reduced-motion */
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');
  var hdr=document.querySelector('.hdr');
  var ham=document.getElementById('ham');
  var panel=document.getElementById('mobile-panel');
  var docsHam=document.getElementById('docs-ham');
  var docsSidebar=document.getElementById('docs-sidebar');
  var docsOverlay=document.getElementById('docs-overlay');
  function onScroll(){
    if(hdr) hdr.classList.toggle('scrolled', window.scrollY>6);
    var prog=document.getElementById('prog');
    if(prog){ var h=document.documentElement.scrollHeight - window.innerHeight; prog.style.width=(h>0?window.scrollY/h*100:0)+'%'; }
  }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
  // generic mobile (header)
  if(ham && panel){
    ham.addEventListener('click', function(){
      var open=ham.getAttribute('aria-expanded')==='true';
      ham.setAttribute('aria-expanded', String(!open));
      panel.classList.toggle('open', !open);
      panel.setAttribute('aria-hidden', String(open));
      document.body.style.overflow=!open?'hidden':'';
    });
    panel.addEventListener('click', function(e){ if(e.target.closest('a')){ ham.setAttribute('aria-expanded','false'); panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }});
    document.addEventListener('keydown', function(e){ if(e.key==='Escape' && panel.classList.contains('open')){ ham.setAttribute('aria-expanded','false'); panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); document.body.style.overflow=''; ham.focus(); }});
    document.addEventListener('click', function(e){ if(panel.classList.contains('open') && !panel.contains(e.target) && !ham.contains(e.target)){ ham.setAttribute('aria-expanded','false'); panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }});
    window.addEventListener('resize', function(){ if(window.innerWidth>760 && panel.classList.contains('open')){ ham.setAttribute('aria-expanded','false'); panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }});
  }
  // docs sidebar drawer (same tokens, different breakpoint 860px)
  function closeDocs(){ if(!docsHam||!docsSidebar) return; docsHam.setAttribute('aria-expanded','false'); docsSidebar.classList.remove('open'); if(docsOverlay) docsOverlay.classList.remove('open'); if(!panel || !panel.classList.contains('open')) document.body.style.overflow=''; }
  function openDocs(){ if(!docsHam||!docsSidebar) return; docsHam.setAttribute('aria-expanded','true'); docsSidebar.classList.add('open'); if(docsOverlay) docsOverlay.classList.add('open'); document.body.style.overflow='hidden'; }
  if(docsHam && docsSidebar){
    docsHam.addEventListener('click', function(){ var o=docsHam.getAttribute('aria-expanded')==='true'; if(o) closeDocs(); else openDocs(); });
    if(docsOverlay) docsOverlay.addEventListener('click', closeDocs);
    docsSidebar.addEventListener('click', function(e){ if(e.target.closest('a')) closeDocs(); });
    window.addEventListener('resize', function(){ if(window.innerWidth>860 && docsSidebar.classList.contains('open')) closeDocs(); });
  }
  // reveals
  function observeReveals(){
    var els=document.querySelectorAll('.rv:not(.in)');
    if('IntersectionObserver' in window && !reduce){
      var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }}); },{threshold:.08});
      els.forEach(function(el){ io.observe(el); });
    } else els.forEach(function(el){ el.classList.add('in'); });
    document.querySelectorAll('.line-mask').forEach(function(el){ if(reduce) el.classList.add('in'); else requestAnimationFrame(function(){ el.classList.add('in'); }); });
  }
  observeReveals();
  window.observeReveals=observeReveals;
  // scramble
  function scramble(el,text){
    if(!el||reduce){ if(el) el.textContent=text; return;}
    var chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789—';
    var out=text.split(''); var i=0;
    var iv=setInterval(function(){
      el.textContent=out.map(function(c,j){ if(c===' '||c==='—'||c==='–') return c; return j<i ? text[j] : chars[Math.floor(Math.random()*chars.length)]; }).join('');
      i+=1.2; if(i>=out.length){ clearInterval(iv); el.textContent=text; }
    },28);
  }
  document.querySelectorAll('[data-scramble]').forEach(function(el){ scramble(el, el.getAttribute('data-scramble'));});
  // countUp
  function countUp(el){
    var to=parseInt(el.getAttribute('data-count')||'0',10);
    var suffix=el.getAttribute('data-suffix')||'';
    if(reduce||isNaN(to)){ el.textContent=to; if(suffix) el.innerHTML=to+'<sup>'+suffix+'</sup>'; return;}
    var cur=0, step=Math.max(1,Math.ceil(to/38));
    var iv=setInterval(function(){ cur+=step; if(cur>=to){ cur=to; clearInterval(iv);} el.innerHTML=suffix?cur+'<sup>'+suffix+'</sup>':String(cur); },22);
  }
  var stats=document.querySelectorAll('[data-count]');
  if(stats.length){
    if('IntersectionObserver' in window && !reduce){
      var io2=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ countUp(e.target); io2.unobserve(e.target); }}); },{threshold:.3});
      stats.forEach(function(s){ io2.observe(s);});
    } else stats.forEach(countUp);
  }
  // typing
  var typeEl=document.querySelector('[data-type]');
  if(typeEl){
    var full=typeEl.getAttribute('data-type')||'';
    if(reduce){ typeEl.textContent=full; }
    else {
      typeEl.textContent=''; var k=0; (function tick(){
        typeEl.textContent=full.slice(0,k);
        var caret=document.createElement('span'); caret.className='caret'; caret.setAttribute('aria-hidden','true');
        typeEl.appendChild(caret);
        k++; if(k<=full.length) setTimeout(tick,28+Math.random()*22); else setTimeout(function(){ if(caret.parentNode) caret.remove(); },900);
      })();
    }
  }
  // live clock
  function tickClock(){ var c=document.getElementById('live-clock'); if(!c) return; var d=new Date(); c.textContent=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+' · '+d.toLocaleDateString([],{year:'numeric',month:'short',day:'2-digit'}).toUpperCase(); }
  tickClock(); setInterval(tickClock,60000);
  // install tabs
  document.querySelectorAll('.install-tabs').forEach(function(tabs){
    var pills=tabs.querySelectorAll('.pill');
    var panels=tabs.parentElement.querySelectorAll('.install-panel');
    // fallback: if panels are siblings of tabs parent, search globally near tabs
    if(!panels.length) panels=document.querySelectorAll('.install-panel');
    pills.forEach(function(p,i){
      p.addEventListener('click', function(){
        pills.forEach(function(x){ x.classList.remove('active'); x.setAttribute('aria-selected','false');});
        p.classList.add('active'); p.setAttribute('aria-selected','true');
        panels.forEach(function(pn){ pn.classList.remove('active');});
        if(panels[i]) panels[i].classList.add('active');
      });
    });
  });
  // TOC highlight
  var toc=document.getElementById('docs-toc');
  var tlinks=toc ? [].slice.call(toc.querySelectorAll('a')) : [];
  var heads=[].slice.call(document.querySelectorAll('.prose h2[id]'));
  if(tlinks.length && heads.length && 'IntersectionObserver' in window && !reduce){
    var map={}; tlinks.forEach(function(a){ map[a.getAttribute('href')]=a;});
    var io3=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ var id='#'+e.target.id; tlinks.forEach(function(a){ a.classList.toggle('active', a.getAttribute('href')===id);});}});},{rootMargin:'-40% 0px -50% 0px',threshold:0});
    heads.forEach(function(h){ io3.observe(h);});
  }
  // code copy for docs prose
  document.querySelectorAll('.prose pre').forEach(function(pre){
    if(pre.querySelector('.copy-btn')) return;
    var btn=document.createElement('button'); btn.className='copy-btn'; btn.type='button'; btn.textContent='⎘ Copy'; btn.setAttribute('aria-label','Copy code');
    var head=pre.querySelector('.code-head');
    if(!head){ head=document.createElement('div'); head.className='code-head'; head.style.cssText='position:absolute;top:8px;right:8px;display:flex;gap:6px;align-items:center'; pre.style.position='relative'; pre.appendChild(head);}
    else head.style.cssText='position:absolute;top:8px;right:8px;display:flex;gap:6px;align-items:center';
    btn.style.cssText='font-family:var(--mono);font-size:11px;background:var(--paper);color:var(--ink);border:1px solid var(--line);padding:5px 8px;cursor:pointer';
    head.appendChild(btn);
    btn.addEventListener('click', function(){
      var code=(pre.querySelector('code')||pre).textContent;
      navigator.clipboard.writeText(code).then(function(){ btn.textContent='✓ Copied'; setTimeout(function(){ btn.textContent='⎘ Copy';},1500);});
    });
  });
  // anchors for docs h2
  document.querySelectorAll('.prose h2[id]').forEach(function(h){
    if(h.querySelector('a.anchor')) return;
    var a=document.createElement('a'); a.href='#'+h.id; a.className='anchor'; a.textContent='#'; a.style.cssText='margin-left:6px;color:var(--line-2);text-decoration:none;opacity:0;transition:opacity .15s';
    a.setAttribute('aria-label','Copy link');
    h.addEventListener('mouseenter', function(){ a.style.opacity='1'; a.style.color='var(--accent)';});
    h.addEventListener('mouseleave', function(){ a.style.opacity='0';});
    a.addEventListener('click', function(e){ e.preventDefault(); var url=location.origin+location.pathname+'#'+h.id; navigator.clipboard.writeText(url).then(function(){ a.textContent='✓'; setTimeout(function(){ a.textContent='#';},1200);}); history.replaceState(null,'','#'+h.id);});
    h.appendChild(a);
  });
  // docs search ⌘K (client-side)
  var dsInput=document.getElementById('docs-search');
  var dsRes=document.getElementById('docs-search-results');
  var dsDataEl=document.getElementById('docs-search-data');
  var pages=[]; try{ if(dsDataEl) pages=JSON.parse(dsDataEl.textContent);}catch(e){}
  if(!pages.length){
    var hs=document.querySelectorAll('.prose h2[id]');
    var cur=location.pathname;
    hs.forEach(function(h){ pages.push({title:h.textContent.replace('#','').trim(), url:cur+'#'+h.id, snip:(h.nextElementSibling&&h.nextElementSibling.textContent||'').slice(0,80)});});
  }
  function renderSearch(list){
    if(!dsRes) return;
    if(!list.length){ dsRes.classList.remove('open'); dsRes.innerHTML=''; if(dsInput) dsInput.setAttribute('aria-expanded','false'); return;}
    dsRes.innerHTML=list.map(function(r,i){ return '<div class="res'+(i===0?' active':'')+'" data-url="'+r.url.replace(/"/g,'&quot;')+'" role="option" style="padding:10px 12px;border-bottom:1px solid var(--line);cursor:pointer"><div style="font-weight:600;font-size:13.5px;color:var(--ink)">'+r.title+'</div><div style="font-size:12.5px;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(r.snip||'')+'</div></div>';}).join('');
    dsRes.classList.add('open'); if(dsInput) dsInput.setAttribute('aria-expanded','true');
    dsRes.querySelectorAll('.res').forEach(function(el){ el.addEventListener('click', function(){ location.href=el.getAttribute('data-url'); closeSearch();});});
    dsRes.style.cssText='position:absolute;left:0;right:0;top:42px;background:var(--paper);border:1px solid var(--line);border-radius:8px;box-shadow:0 12px 32px rgba(24,22,17,.12);max-height:360px;overflow:auto;z-index:70;display:block';
  }
  function doSearch(q){ q=(q||'').trim().toLowerCase(); if(!q){ renderSearch([]); return;} var out=pages.filter(function(p){ return (p.title+' '+(p.snip||'')+' '+p.url).toLowerCase().indexOf(q)!==-1;}).slice(0,8); renderSearch(out); }
  var sTimer=null;
  if(dsInput){
    dsInput.addEventListener('input', function(){ clearTimeout(sTimer); sTimer=setTimeout(function(){ doSearch(dsInput.value);},120);});
    dsInput.addEventListener('keydown', function(e){
      if(e.key==='Enter'){ var first=dsRes&&dsRes.querySelector('.res'); if(first){ e.preventDefault(); location.href=first.getAttribute('data-url'); closeSearch();}}
      if(e.key==='Escape') closeSearch();
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){
        if(!dsRes||!dsRes.classList.contains('open')) return;
        e.preventDefault();
        var act=dsRes.querySelector('.res.active'), all=[].slice.call(dsRes.querySelectorAll('.res'));
        var idx=all.indexOf(act);
        if(e.key==='ArrowDown') idx=Math.min(all.length-1,idx+1); else idx=Math.max(0,idx-1);
        all.forEach(function(r){ r.classList.remove('active');}); if(all[idx]) all[idx].classList.add('active');
      }
    });
    dsInput.addEventListener('focus', function(){ if(dsInput.value.trim()) doSearch(dsInput.value);});
    document.addEventListener('click', function(e){ if(dsInput&&dsRes && !dsInput.contains(e.target) && !dsRes.contains(e.target)) closeSearch();});
  }
  function closeSearch(){ if(dsRes){ dsRes.classList.remove('open'); dsRes.innerHTML=''; dsRes.style.display='none'; if(dsInput) dsInput.setAttribute('aria-expanded','false');}}
  document.addEventListener('keydown', function(e){ if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); if(dsInput){ dsInput.focus(); dsInput.select();}}});
})();
