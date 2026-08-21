// claude-system — vanilla app for claude.com + code.claude.com chrome
// Header + sidebar + search + TOC + copy + install tabs — no grain/progress
(function(){
  var ham = document.getElementById('ham');
  var panel = document.getElementById('mobile-panel');
  if(ham && panel){
    ham.addEventListener('click', function(){
      var open = ham.getAttribute('aria-expanded') === 'true';
      ham.setAttribute('aria-expanded', String(!open));
      panel.classList.toggle('open', !open);
      panel.setAttribute('aria-hidden', String(open));
    });
  }
  // docs sidebar (docs pages)
  var dHam = document.getElementById('docs-ham');
  var dSide = document.getElementById('docs-sidebar');
  var dOver = document.getElementById('docs-overlay');
  function closeDocs(){
    if(dSide) dSide.classList.remove('open');
    if(dOver) dOver.classList.remove('open');
    if(dHam) dHam.setAttribute('aria-expanded','false');
  }
  if(dHam && dSide){
    dHam.addEventListener('click', function(){
      var open = dSide.classList.contains('open');
      dSide.classList.toggle('open', !open);
      if(dOver) dOver.classList.toggle('open', !open);
      dHam.setAttribute('aria-expanded', String(!open));
    });
  }
  if(dOver) dOver.addEventListener('click', closeDocs);
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape'){ closeDocs(); if(panel) {panel.classList.remove('open'); if(ham) ham.setAttribute('aria-expanded','false');} }
  });
  // search ⌘K
  var ds = document.getElementById('docs-search');
  var dr = document.getElementById('docs-search-results');
  var hdrSearch = document.getElementById('hdr-search');
  var hdrRes = document.getElementById('hdr-search-results');
  function bindSearch(input, results){
    if(!input || !results) return;
    var dataEl = document.getElementById('docs-search-data');
    var data = [];
    try{ data = dataEl ? JSON.parse(dataEl.textContent) : []; }catch(e){}
    // also collect headings from prose for client-side
    document.querySelectorAll('.prose h2, .prose h3').forEach(function(h){
      if(!h.id) return;
      data.push({title:h.textContent.trim(), url:'#'+h.id, snip:''});
    });
    function render(q){
      if(!q){ results.classList.remove('open'); results.innerHTML=''; return; }
      var qq=q.toLowerCase();
      var hits = data.filter(function(d){ return d.title.toLowerCase().indexOf(qq)!==-1; }).slice(0,6);
      if(!hits.length){ results.classList.remove('open'); return; }
      results.innerHTML = hits.map(function(h){ return '<a href="'+h.url+'"><div class="hit-title">'+h.title+'</div>'+(h.snip?'<div class="hit-snip">'+h.snip+'</div>':'')+'</a>'; }).join('');
      results.classList.add('open');
    }
    input.addEventListener('input', function(){ render(input.value.trim()); });
    input.addEventListener('focus', function(){ if(input.value.trim()) render(input.value.trim()); });
    input.addEventListener('blur', function(){ setTimeout(function(){ results.classList.remove('open'); }, 180); });
    // keyboard
    input.addEventListener('keydown', function(e){
      if(e.key==='Escape'){ results.classList.remove('open'); input.value=''; }
    });
  }
  bindSearch(ds, dr);
  bindSearch(hdrSearch, hdrRes);
  document.addEventListener('keydown', function(e){
    if((e.metaKey || e.ctrlKey) && e.key.toLowerCase()==='k'){
      var inp = ds || hdrSearch;
      if(inp){ e.preventDefault(); inp.focus(); inp.select(); }
    }
    if(e.key==='/' && document.activeElement.tagName!=='INPUT' && !e.metaKey && !e.ctrlKey){
      var q = document.getElementById('q'); if(q){ e.preventDefault(); q.focus(); }
    }
  });
  // TOC active
  var toc = document.getElementById('docs-toc');
  if(toc){
    var links = Array.from(toc.querySelectorAll('a'));
    var map = {};
    links.forEach(function(a){ var id=a.getAttribute('href'); if(id && id[0]==='#') map[id.slice(1)]=a; });
    var hs = Object.keys(map).map(function(id){ return document.getElementById(id); }).filter(Boolean);
    if('IntersectionObserver' in window && hs.length){
      var obs = new IntersectionObserver(function(entries){
        entries.forEach(function(ent){
          if(ent.isIntersecting){
            links.forEach(function(a){ a.classList.remove('active'); });
            var a = map[ent.target.id];
            if(a) a.classList.add('active');
          }
        });
      }, {rootMargin:'-20% 0px -70% 0px', threshold:0});
      hs.forEach(function(h){ obs.observe(h); });
    }
  }
  // copy buttons
  document.querySelectorAll('pre').forEach(function(pre){
    if(pre.querySelector('.copy')) return;
    var head = pre.previousElementSibling;
    if(head && head.classList.contains('code-head')) return;
    var wrap = document.createElement('div');
    wrap.style.position='relative';
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);
    var btn = document.createElement('button');
    btn.className='copy';
    btn.type='button';
    btn.textContent='Copy';
    btn.style.position='absolute';
    btn.style.top='8px';
    btn.style.right='8px';
    btn.addEventListener('click', function(){
      var txt = pre.innerText || pre.textContent;
      navigator.clipboard.writeText(txt).then(function(){
        btn.textContent='Copied';
        btn.classList.add('ok');
        setTimeout(function(){ btn.textContent='Copy'; btn.classList.remove('ok'); }, 1500);
      });
    });
    wrap.appendChild(btn);
  });
  // install tabs
  document.querySelectorAll('.install-tabs').forEach(function(tabs){
    var btns = tabs.querySelectorAll('[data-tab]');
    var panels = tabs.parentElement.querySelectorAll('.install-panel');
    btns.forEach(function(b){
      b.addEventListener('click', function(){
        var idx=b.getAttribute('data-tab');
        btns.forEach(function(x){ x.classList.toggle('active', x===b); });
        panels.forEach(function(p,i){ p.classList.toggle('active', String(i)===String(idx)); });
      });
    });
  });
  // copy install
  var copyInstall = document.getElementById('copy-install');
  if(copyInstall){
    copyInstall.addEventListener('click', function(){
      var code = document.getElementById('install-code-0');
      var txt = code ? code.textContent : 'claude-system install example-system';
      navigator.clipboard.writeText(txt).then(function(){
        var orig=copyInstall.textContent;
        copyInstall.textContent='Copied';
        setTimeout(function(){ copyInstall.textContent=orig; },1200);
      });
    });
  }
})();
