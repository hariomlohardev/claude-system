/* docs.js — sidebar + search ⌘K + toc highlight + code copy + anchors */
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // sidebar drawer
  var ham=document.getElementById('docs-ham'), sidebar=document.getElementById('docs-sidebar'), overlay=document.getElementById('docs-overlay');
  function closeDrawer(){ if(!ham||!sidebar) return; ham.setAttribute('aria-expanded','false'); sidebar.classList.remove('open'); if(overlay) overlay.classList.remove('open'); document.body.style.overflow='';}
  function openDrawer(){ if(!ham||!sidebar) return; ham.setAttribute('aria-expanded','true'); sidebar.classList.add('open'); if(overlay) overlay.classList.add('open'); document.body.style.overflow='hidden';}
  if(ham && sidebar){
    ham.addEventListener('click', function(){ var o=ham.getAttribute('aria-expanded')==='true'; if(o) closeDrawer(); else openDrawer();});
    if(overlay) overlay.addEventListener('click', closeDrawer);
    sidebar.addEventListener('click', function(e){ if(e.target.closest('a')) closeDrawer();});
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') { closeDrawer(); closeSearch(); }});
    window.addEventListener('resize', function(){ if(window.innerWidth>900) closeDrawer();});
  }
  // search
  var input=document.getElementById('docs-search'), results=document.getElementById('docs-search-results');
  var pages=[]; // filled from data-pages
  try{ var d=document.getElementById('docs-search-data'); if(d) pages=JSON.parse(d.textContent); }catch(e){}
  // also index current page headings if pages empty
  function indexHeadings(){
    var hs=document.querySelectorAll('.docs-prose h2[id], .docs-prose h3[id]');
    var cur=location.pathname;
    hs.forEach(function(h){
      pages.push({title:h.textContent.replace('#','').trim(), url: cur + '#'+h.id, snip: (h.nextElementSibling && h.nextElementSibling.textContent || '').slice(0,80)});
    });
  }
  if(!pages.length) indexHeadings();
  function render(list){
    if(!results) return;
    if(!list.length){ results.classList.remove('open'); results.innerHTML=''; return;}
    results.innerHTML = list.map(function(r,i){ return '<div class="res'+(i===0?' active':'')+'" data-url="'+r.url.replace(/"/g,'&quot;')+'" role="option"><div class="res-title">'+r.title+'</div><div class="res-snip">'+(r.snip||'')+'</div></div>'; }).join('');
    results.classList.add('open');
    results.querySelectorAll('.res').forEach(function(el){ el.addEventListener('click', function(){ location.href=el.getAttribute('data-url'); closeSearch();});});
  }
  function doSearch(q){
    q=(q||'').trim().toLowerCase();
    if(!q){ render([]); return;}
    var out=pages.filter(function(p){ return (p.title+' '+(p.snip||'')+' '+p.url).toLowerCase().indexOf(q)!==-1; }).slice(0,8);
    render(out);
  }
  var sTimer=null;
  if(input){
    input.addEventListener('input', function(){ clearTimeout(sTimer); sTimer=setTimeout(function(){ doSearch(input.value); },120);});
    input.addEventListener('keydown', function(e){
      if(e.key==='Enter'){
        var first=results && results.querySelector('.res');
        if(first){ e.preventDefault(); location.href=first.getAttribute('data-url'); closeSearch(); }
      }
      if(e.key==='Escape'){ closeSearch(); }
      if(e.key==='ArrowDown' || e.key==='ArrowUp'){
        if(!results || !results.classList.contains('open')) return;
        e.preventDefault();
        var act=results.querySelector('.res.active'), all=[].slice.call(results.querySelectorAll('.res'));
        var idx=all.indexOf(act);
        if(e.key==='ArrowDown') idx=Math.min(all.length-1, idx+1); else idx=Math.max(0, idx-1);
        all.forEach(function(r){ r.classList.remove('active');}); if(all[idx]) all[idx].classList.add('active');
      }
    });
    input.addEventListener('focus', function(){ if(input.value.trim()) doSearch(input.value);});
    document.addEventListener('click', function(e){ if(!input.contains(e.target) && !results.contains(e.target)) closeSearch();});
  }
  function closeSearch(){ if(results) { results.classList.remove('open'); results.innerHTML=''; } }
  // ⌘K
  document.addEventListener('keydown', function(e){
    if((e.metaKey || e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); if(input) { input.focus(); input.select(); } }
  });
  // TOC highlight
  var toc=document.getElementById('docs-toc');
  var links=toc ? [].slice.call(toc.querySelectorAll('a')) : [];
  var heads=[].slice.call(document.querySelectorAll('.docs-prose h2[id]'));
  if(links.length && heads.length && 'IntersectionObserver' in window && !reduce){
    var map={}; links.forEach(function(a){ map[a.getAttribute('href')] = a;});
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){
          var id='#'+e.target.id;
          links.forEach(function(a){ a.classList.toggle('active', a.getAttribute('href')===id);});
        }
      });
    }, {rootMargin:'-40% 0px -50% 0px', threshold:0});
    heads.forEach(function(h){ io.observe(h);});
  }
  // code copy
  document.querySelectorAll('pre').forEach(function(pre){
    if(pre.querySelector('.copy-btn')) return;
    var btn=document.createElement('button'); btn.className='copy-btn'; btn.type='button'; btn.textContent='⎘ Copy'; btn.setAttribute('aria-label','Copy code');
    var head=pre.querySelector('.code-head');
    if(!head){ head=document.createElement('div'); head.className='code-head'; pre.style.position='relative'; pre.appendChild(head); }
    head.appendChild(btn);
    btn.addEventListener('click', function(){
      var code=(pre.querySelector('code')||pre).textContent;
      navigator.clipboard.writeText(code).then(function(){
        btn.textContent='✓ Copied'; setTimeout(function(){ btn.textContent='⎘ Copy'; },1500);
      });
    });
  });
  // anchors
  document.querySelectorAll('.docs-prose h2[id]').forEach(function(h){
    var a=document.createElement('a'); a.href='#'+h.id; a.className='anchor'; a.textContent='#'; a.setAttribute('aria-label','Copy link'); a.addEventListener('click', function(e){
      e.preventDefault(); var url=location.origin + location.pathname + '#'+h.id; navigator.clipboard.writeText(url).then(function(){ a.textContent='✓'; setTimeout(function(){ a.textContent='#';},1200);}); history.replaceState(null,'','#'+h.id);
    }); h.appendChild(a);
  });
})();
