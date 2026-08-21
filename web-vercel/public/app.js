// claude-system — paper + ink ledger — prog, header shadow, menu, reveal, tabs, copy, G
(function(){
"use strict";
var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var yr=document.getElementById('yr'); if(yr) yr.textContent=new Date().getFullYear();
var hdr=document.querySelector('header'),prog=document.getElementById('prog'),qd=false;
function onScroll(){if(qd)return;qd=true;requestAnimationFrame(function(){qd=false;var h=document.documentElement.scrollHeight-window.innerHeight;if(prog)prog.style.width=(h>0?(window.scrollY/h)*100:0)+'%';if(hdr)hdr.classList.toggle('scrolled',window.scrollY>8);});}
window.addEventListener('scroll',onScroll,{passive:true});onScroll();
var menuBtn=document.getElementById('menuBtn'),panel=document.getElementById('mobilePanel');
if(menuBtn&&panel){
  function setMenu(o){menuBtn.setAttribute('aria-expanded',String(o));menuBtn.setAttribute('aria-label',o?'Close menu':'Open menu');menuBtn.classList.toggle('open',o);panel.classList.toggle('open',o);panel.setAttribute('aria-hidden',String(!o));}
  menuBtn.addEventListener('click',function(){setMenu(menuBtn.getAttribute('aria-expanded')!=='true');});
  panel.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){setMenu(false);});});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&panel.classList.contains('open'))setMenu(false);});
  document.addEventListener('click',function(e){if(panel.classList.contains('open')&&!panel.contains(e.target)&&!menuBtn.contains(e.target))setMenu(false);});
  window.addEventListener('resize',function(){if(window.innerWidth>760&&panel.classList.contains('open'))setMenu(false);});
}
// reveal
(function(){
  var els=document.querySelectorAll('.rv:not(.in)');
  if('IntersectionObserver' in window&&!reduced){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.08});
    els.forEach(function(el,i){el.style.transitionDelay=(Math.min(i,5)*50)+'ms';io.observe(el);});
  }else els.forEach(function(el){el.classList.add('in');});
})();
// OS tabs
var osBtns=document.querySelectorAll('.os-tabs .pill, .os-btns .pill');
osBtns.forEach(function(btn){
  btn.addEventListener('click',function(){
    var os=btn.getAttribute('data-os');
    osBtns.forEach(function(b){b.classList.remove('on');b.setAttribute('aria-selected','false');});
    btn.classList.add('on');btn.setAttribute('aria-selected','true');
    document.querySelectorAll('.os-panel').forEach(function(p){
      p.classList.toggle('show',p.getAttribute('data-panel')===os);
    });
  });
});
// copy
document.querySelectorAll('.code-head .copy').forEach(function(btn){
  btn.addEventListener('click',function(){
    var pre=btn.closest('.codeblock').querySelector('pre');
    if(!pre) pre=btn.closest('.codeblock').querySelector('pre code');
    var txt=pre?pre.textContent:'';
    if(navigator.clipboard){navigator.clipboard.writeText(txt).then(function(){btn.textContent='Copied ✓';setTimeout(function(){btn.textContent='Copy';},1600);});}
    else{prompt('Copy code:',txt);}
  });
});
// shortcuts
var sideFilter=document.getElementById('sideFilter');
document.addEventListener('keydown',function(e){
  var t=(document.activeElement&&document.activeElement.tagName)||'';
  if(e.key==='/'&&!/INPUT|TEXTAREA/.test(t)){e.preventDefault(); var q=document.getElementById('q'); if(q) q.focus(); else if(sideFilter) sideFilter.focus();}
  if((e.key==='g'||e.key==='G')&&!/INPUT|TEXTAREA/.test(t)&&!e.metaKey&&!e.ctrlKey&&!e.altKey){window.open('https://github.com/hariomlohardev/claude-system','_blank','noopener');}
});
var topBtn=document.getElementById('topBtn'); if(topBtn) topBtn.addEventListener('click',function(){window.scrollTo({top:0,behavior:reduced?'auto':'smooth'});});
// ham alias for old header
var ham=document.getElementById('ham'); var mp=document.getElementById('mobile-panel');
if(ham&&mp&&!menuBtn){
  ham.addEventListener('click',function(){ var o=ham.getAttribute('aria-expanded')==='true'; ham.setAttribute('aria-expanded',String(!o)); mp.classList.toggle('open',!o); });
}
// star count — non-blocking, fallback to label only
try{
  fetch('https://api.github.com/repos/hariomlohardev/claude-system', {headers:{Accept:'application/vnd.github.v3+json'}})
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(d){
      if(!d || typeof d.stargazers_count !== 'number') return;
      document.querySelectorAll('.star-count').forEach(function(el){
        el.textContent=' · ★ '+d.stargazers_count;
        el.style.opacity='.85';
      });
    }).catch(function(){});
}catch(e){}
})();
