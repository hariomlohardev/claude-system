/* app.js — shared editorial interactions — <4KB gzipped, vanilla, respects reduced-motion */
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // header scroll shadow + mobile toggle
  var hdr = document.querySelector('.hdr');
  var ham = document.getElementById('ham');
  var panel = document.getElementById('mobile-panel');
  function onScroll(){
    if(!hdr) return;
    hdr.classList.toggle('scrolled', window.scrollY > 6);
    var prog = document.getElementById('prog');
    if(prog){
      var h = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.width = (h>0? window.scrollY/h*100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
  if(ham && panel){
    ham.addEventListener('click', function(){
      var open = ham.getAttribute('aria-expanded') === 'true';
      ham.setAttribute('aria-expanded', String(!open));
      panel.classList.toggle('open', !open);
      panel.setAttribute('aria-hidden', String(open));
      document.body.style.overflow = !open ? 'hidden' : '';
    });
    panel.addEventListener('click', function(e){
      if(e.target.closest('a')){
        ham.setAttribute('aria-expanded','false'); panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); document.body.style.overflow='';
      }
    });
    document.addEventListener('keydown', function(e){
      if(e.key==='Escape' && panel.classList.contains('open')){
        ham.setAttribute('aria-expanded','false'); panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); document.body.style.overflow=''; ham.focus();
      }
    });
    document.addEventListener('click', function(e){
      if(panel.classList.contains('open') && !panel.contains(e.target) && !ham.contains(e.target)){
        ham.setAttribute('aria-expanded','false'); panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); document.body.style.overflow='';
      }
    });
    window.addEventListener('resize', function(){
      if(window.innerWidth>760 && panel.classList.contains('open')){
        ham.setAttribute('aria-expanded','false'); panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); document.body.style.overflow='';
      }
    });
  }
  // reveals
  function observe(){
    var els = document.querySelectorAll('.rv:not(.in)');
    if('IntersectionObserver' in window && !reduce){
      var io = new IntersectionObserver(function(es){
        es.forEach(function(e){
          if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, {threshold:.08});
      els.forEach(function(el){ io.observe(el); });
    } else {
      els.forEach(function(el){ el.classList.add('in'); });
    }
    // line-mask
    document.querySelectorAll('.line-mask').forEach(function(el){
      if(reduce) el.classList.add('in'); else requestAnimationFrame(function(){ el.classList.add('in'); });
    });
  }
  observe();
  // scramble
  function scramble(el, text){
    if(!el || reduce){ if(el) el.textContent=text; return; }
    var chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789—';
    var out=text.split(''); var i=0;
    var iv=setInterval(function(){
      el.textContent = out.map(function(c,j){
        if(c===' '||c==='—'||c==='–') return c;
        return j < i ? text[j] : chars[Math.floor(Math.random()*chars.length)];
      }).join('');
      i+=1.2;
      if(i>=out.length){ clearInterval(iv); el.textContent=text; }
    }, 28);
  }
  document.querySelectorAll('[data-scramble]').forEach(function(el){
    scramble(el, el.getAttribute('data-scramble'));
  });
  // count-up
  function countUp(el){
    var to = parseInt(el.getAttribute('data-count')||'0',10);
    var suffix = el.getAttribute('data-suffix')||'';
    if(reduce || isNaN(to)){ el.textContent = to + (suffix? ' '+suffix : ''); if(suffix) el.innerHTML = to + '<sup>'+suffix+'</sup>'; return; }
    var cur=0; var step=Math.max(1, Math.ceil(to/38));
    var iv=setInterval(function(){
      cur+=step; if(cur>=to){ cur=to; clearInterval(iv); }
      el.textContent = cur;
      if(suffix) el.innerHTML = cur + '<sup>'+suffix+'</sup>';
      else el.textContent = String(cur);
    }, 22);
  }
  // trigger count when stats in view
  var stats = document.querySelectorAll('[data-count]');
  if(stats.length){
    if('IntersectionObserver' in window && !reduce){
      var io2=new IntersectionObserver(function(es){
        es.forEach(function(e){
          if(e.isIntersecting){ countUp(e.target); io2.unobserve(e.target); }
        });
      },{threshold:.3});
      stats.forEach(function(s){ io2.observe(s); });
    } else stats.forEach(countUp);
  }
  // typing
  var typeEl = document.querySelector('[data-type]');
  if(typeEl){
    var full = typeEl.getAttribute('data-type')||'';
    if(reduce){ typeEl.textContent = full; }
    else {
      typeEl.textContent='';
      var k=0; (function tick(){
        typeEl.textContent = full.slice(0,k);
        var caret = document.createElement('span'); caret.className='caret'; caret.setAttribute('aria-hidden','true');
        typeEl.appendChild(caret);
        k++;
        if(k<=full.length) setTimeout(tick, 28 + Math.random()*22);
        else setTimeout(function(){ if(caret.parentNode) caret.remove(); }, 900);
      })();
    }
  }
  // live clock in footer
  function tickClock(){
    var c=document.getElementById('live-clock');
    if(!c) return;
    var d=new Date();
    c.textContent = d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) + ' · ' + d.toLocaleDateString([], {year:'numeric', month:'short', day:'2-digit'}).toUpperCase();
  }
  tickClock(); setInterval(tickClock, 60000);
  // install tabs
  document.querySelectorAll('.install-tabs').forEach(function(tabs){
    var pills=tabs.querySelectorAll('.pill');
    var panels=document.querySelectorAll('.install-panel');
    pills.forEach(function(p,i){
      p.addEventListener('click', function(){
        pills.forEach(function(x){ x.classList.remove('active'); x.setAttribute('aria-selected','false'); });
        p.classList.add('active'); p.setAttribute('aria-selected','true');
        panels.forEach(function(pn){ pn.classList.remove('active'); });
        if(panels[i]) panels[i].classList.add('active');
      });
    });
  });
})();
