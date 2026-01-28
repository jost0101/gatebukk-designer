
(function(){
 const el=document.getElementById('boot-diag');
 const set=t=>{if(el) el.textContent=t;};
 set('BOOT: JS LOADED');
 window.addEventListener('error',e=>set('BOOT: ERROR '+(e.message||'unknown')));
 window.addEventListener('unhandledrejection',e=>set('BOOT: REJECT'));
 window.__BOOT_OK__=()=>{set('BOOT: OK');setTimeout(()=>{if(el) el.style.opacity='0.25';},1500);};
})();
