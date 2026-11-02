/* BlueFluteX / scroll-controlled image flight and native studio overlays. */
(() => {
  "use strict";
  const $ = (selector,root=document) => root.querySelector(selector);
  const $$ = (selector,root=document) => Array.from(root.querySelectorAll(selector));
  const hero=$(".hero"), M=window.BlueFluteFlightMath;
  if(!hero||!M||!window.BlueFluteField) return;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const entries=[
    {name:"CleanBoost",kind:"Windows desktop / Public project",image:"work-cleaner-scan.webp",panel:"work",contain:true},
    {name:"Android & iOS",kind:"Mobile / Studio discipline",image:"studio-mobile.svg",panel:"services"},
    {name:"Desktop",kind:"Cross-platform / Studio discipline",image:"studio-desktop.svg",panel:"services"},
    {name:"Game development",kind:"Interactive worlds / Studio discipline",image:"studio-play.svg",panel:"services"},
    {name:"AI & data systems",kind:"Intelligence / Studio discipline",image:"studio-intelligence.svg",panel:"services"},
    {name:"Architecture & audit",kind:"Connected systems / Studio discipline",image:"studio-systems.svg",panel:"services"},
    {name:"Engineering",kind:"Readable by the next person",image:"studio-engineering.svg",panel:"process"},
    {name:"BlueFluteX",kind:"Code with harmony / The studio",image:"studio-resonance.svg",panel:"studio"},
  ];
  const panel=$("[data-studio-panel]"), panelContent=$("[data-panel-content]");
  const cardsRoot=$("[data-flight-cards]"), hud=$("[data-flight-hud]");
  const toggles=$$("[data-motion-toggle]");
  const homeCopy=$$("[data-home-copy]");
  const trailCanvas=$("#pointer-trail"), trailCtx=trailCanvas?.getContext("2d");
  let renderer=null, frame=0, previous=0, elapsed=0, destroyed=false;
  let width=0,height=0,dpr=1,progress=0,target=0,blend=0,blendTarget=0;
  let pointerX=0,pointerY=0,smoothedX=0,smoothedY=0,userPaused=false,modalOpen=false;
  let active=-1,trail=[],touchY=null,pendingHomeFocus=false,activeContent=null,placeholder=null;
  const maxProgress=entries.length-1+.62;
  const cards=entries.map((entry,index)=>{
    const button=document.createElement("button");button.type="button";button.className="flight-card";button.tabIndex=-1;
    button.setAttribute("aria-label",`Explore ${entry.name}: ${entry.kind}`);
    button.dataset.cover=entry.contain?"contain":"cover";
    const img=new Image();img.src="assets/img/"+entry.image;img.alt=entry.name;img.decoding="async";
    const label=document.createElement("span");label.className="flight-card__name";label.textContent=entry.name;
    button.append(img,label);button.addEventListener("click",()=>openPanel(entry.panel));cardsRoot.appendChild(button);
    return {button,point:M.card(index)};
  });
  document.documentElement.classList.add("flight-enabled");

  const clock=$("[data-studio-time]");
  const updateClock=()=>{
    if(!clock) return;
    const now=new Date();clock.dateTime=now.toISOString();
    clock.textContent=`(${new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit",hour12:false}).format(now)})`;
  };
  updateClock();const clockTimer=setInterval(updateClock,30000);

  function requestTick() {
    if(!frame&&!destroyed&&!document.hidden&&!modalOpen) frame=requestAnimationFrame(tick);
  }
  function setActive(index) {
    if(index===active) return;active=index;
    $("[data-current-number]").textContent=String(index+1).padStart(3,"0");
    $("[data-current-name]").textContent=entries[index].name;
    $("[data-current-kind]").textContent=entries[index].kind;
    $("[data-current-view]").setAttribute("aria-label",`Explore ${entries[index].name}`);
    $("[data-flight-count]").textContent=`${index+1} of ${entries.length} views`;
  }
  function drawTrail(now) {
    if(!trailCtx) return;
    trailCtx.setTransform(dpr,0,0,dpr,0,0);trailCtx.clearRect(0,0,width,height);
    trail=trail.filter(point=>now-point.time<1.25);
    if(reduced.matches||userPaused) {trail=[];return;}
    for(let i=2;i<trail.length;i++) {
      const before=trail[i-2], point=trail[i-1], next=trail[i];
      const life=M.clamp(1-(now-point.time)/1.25);
      trailCtx.beginPath();trailCtx.moveTo((before.x+point.x)/2,(before.y+point.y)/2);
      trailCtx.quadraticCurveTo(point.x,point.y,(point.x+next.x)/2,(point.y+next.y)/2);
      trailCtx.lineWidth=.6+life*1.2;trailCtx.strokeStyle=`rgba(228,233,228,${life*.48})`;
      trailCtx.shadowBlur=3;trailCtx.shadowColor="rgba(236,241,235,.18)";trailCtx.stroke();
    }
  }
  function paint(now) {
    const b=M.ease(blend);
    const camera=M.camera(progress,b,smoothedX,smoothedY);
    renderer?.draw({width,height,camera,blend:b,time:elapsed,pointerX:smoothedX,pointerY:smoothedY});
    const homeOpacity=1-M.ease(M.clamp(blend*1.55));
    hero.style.setProperty("--home-opacity",String(homeOpacity));
    hero.style.setProperty("--flight-opacity",String(M.ease((blend-.12)/.6)));
    hero.classList.toggle("is-flight",blendTarget>0||blend>.1);
    homeCopy.forEach(element=>{element.inert=homeOpacity<.05;});
    hud.hidden=blend<.08;cardsRoot.hidden=blend<.02;
    const index=M.clamp(Math.floor(progress+.025),0,entries.length-1);setActive(index);
    cards.forEach(({button,point},i)=>{
      const first=M.project(point,camera,width,height,b);
      const exit=M.clamp((900-first.depth)/800);
      const side=i%2?1:-1;
      const p=M.project({x:point.x+side*exit*exit*420,y:point.y+exit*exit*75,z:point.z},camera,width,height,b);
      const visible=p.depth>100&&p.depth<5800&&blend>.02;
      button.hidden=!visible;
      button.tabIndex=visible&&i===index&&blend>.8?0:-1;
      if(!visible) return;
      button.style.transform=`translate3d(${p.x-195}px,${p.y-146.25}px,0) scale(${p.scale})`;
      button.style.opacity=String(M.ease((blend-.12)/.55)*M.clamp((p.depth-100)/140)*M.clamp((5800-p.depth)/1200));
      button.style.zIndex=String(Math.round(6000-p.depth));
      button.style.pointerEvents=p.depth<2800&&blend>.65?"auto":"none";
      button.dataset.depth=String(Math.round(p.depth));
    });
    hero.dataset.flightProgress=progress.toFixed(3);
    hero.dataset.flightMode=blendTarget?"flight":"home";
    drawTrail(now);
    if(pendingHomeFocus&&blend<.015) {
      pendingHomeFocus=false;$("[data-enter-flight]",$(".hero__actions"))?.focus({preventScroll:true});
    }
  }
  function tick(timestamp) {
    frame=0;if(destroyed||modalOpen||document.hidden) return;
    const now=timestamp/1000,dt=previous?Math.max(0,now-previous):1/60;previous=now;
    const still=userPaused||reduced.matches;
    if(still) {progress=target;blend=blendTarget;smoothedX=pointerX;smoothedY=pointerY;}
    else {
      const follow=1-Math.exp(-dt*6.5),enter=1-Math.exp(-dt*5.5);
      progress+=(target-progress)*follow;blend+=(blendTarget-blend)*enter;
      smoothedX+=(pointerX-smoothedX)*follow;smoothedY+=(pointerY-smoothedY)*follow;elapsed+=Math.min(dt,.05);
    }
    if(Math.abs(target-progress)<.0001) progress=target;
    if(Math.abs(blendTarget-blend)<.0001) blend=blendTarget;
    paint(now);
    const moving=Math.abs(target-progress)>.0001||Math.abs(blendTarget-blend)>.0001||Math.abs(pointerX-smoothedX)>.0001||Math.abs(pointerY-smoothedY)>.0001;
    if(!still&&(blendTarget===0||moving||trail.length)) requestTick();
  }
  function resize() {
    width=hero.clientWidth;height=hero.clientHeight;dpr=Math.min(devicePixelRatio||1,1.5);
    renderer?.resize(width,height,dpr);
    if(trailCanvas){trailCanvas.width=Math.round(width*dpr);trailCanvas.height=Math.round(height*dpr);}
    requestTick();
  }
  function syncToggles() {
    toggles.forEach(button=>{
      button.hidden=reduced.matches;button.setAttribute("aria-pressed",String(userPaused));
      button.textContent=userPaused?"Resume motion":"Pause motion";
    });
    hero.classList.toggle("is-motion-paused",userPaused||reduced.matches);previous=0;requestTick();
  }
  function closeDrawer() {
    $("[data-drawer]")?.setAttribute("hidden","");$("[data-drawer]")?.classList.remove("is-open");
    $("[data-burger]")?.setAttribute("aria-expanded","false");
  }
  function enter(index) {
    closeDrawer();blendTarget=1;pendingHomeFocus=false;
    if(typeof index==="number") target=M.clamp(index+.12,0,maxProgress);
    else if(!target) target=.12;
    requestTick();
  }
  function home(focus=true) {
    closeDrawer();target=0;blendTarget=0;pendingHomeFocus=focus;requestTick();
  }
  function move(delta) {
    if(!blendTarget) {blendTarget=1;target=0;}
    target=M.clamp(target+delta,-.4,maxProgress);
    if(target<=-.32) home(false);
    requestTick();
  }
  function restore() {
    if(activeContent&&placeholder) {placeholder.replaceWith(activeContent);activeContent=placeholder=null;}
    modalOpen=false;document.body.classList.remove("overlay-open");previous=0;requestTick();
  }
  function closePanel() {panel?.close();restore();}
  function openPanel(id) {
    const section=document.getElementById(id),inner=section?.querySelector(":scope > .wrap");
    if(!inner||panel?.open) return;
    if(!panel||typeof panel.showModal!=="function") {
      document.documentElement.classList.remove("flight-enabled");section.scrollIntoView();return;
    }
    closeDrawer();placeholder=document.createElement("div");placeholder.className="panel-placeholder";
    inner.before(placeholder);activeContent=inner;panelContent.appendChild(inner);
    $("#panel-label").textContent={work:"Selected work",services:"What we build",studio:"The studio",contact:"Start a project",process:"Our process"}[id]||"Explore";
    panel.dataset.view=id;document.body.classList.add("overlay-open");modalOpen=true;
    if(frame) cancelAnimationFrame(frame);frame=0;
    try {panel.showModal();panelContent.scrollTop=0;}
    catch {restore();document.documentElement.classList.remove("flight-enabled");section.scrollIntoView();}
  }
  document.addEventListener("click",event=>{
    if(!document.documentElement.classList.contains("flight-enabled")) return;
    const link=event.target.closest("a[href]");
    if(!link||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0) return;
    if(link.hasAttribute("data-enter-flight")) {event.preventDefault();enter();return;}
    const id=link.dataset.panel||link.getAttribute("href")?.match(/^#(work|services|studio|contact|process)$/)?.[1];
    if(id) {event.preventDefault();if(panel?.open) closePanel();openPanel(id);return;}
    if(link.getAttribute("href")==="#top") {event.preventDefault();home();}
  });
  $("[data-flight-home]")?.addEventListener("click",()=>home());
  $("[data-current-view]")?.addEventListener("click",()=>openPanel(entries[Math.max(active,0)].panel));
  $("[data-panel-close]")?.addEventListener("click",closePanel);
  panel?.addEventListener("close",()=>{if(!panel.open) restore();});
  panel?.addEventListener("click",event=>{
    if(event.target!==panel) return;const r=panel.getBoundingClientRect();
    if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) closePanel();
  });
  toggles.forEach(button=>button.addEventListener("click",()=>{userPaused=!userPaused;syncToggles();}));
  addEventListener("wheel",event=>{
    if(!document.documentElement.classList.contains("flight-enabled")||modalOpen||event.ctrlKey||!$("[data-drawer]")?.hidden||Math.abs(event.deltaY)<.01) return;
    event.preventDefault();
    const pixels=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?height:1);
    if(!blendTarget&&pixels<0) return;
    move(M.clamp(pixels,-1800,1800)*.0011);
  },{passive:false});
  hero.addEventListener("touchstart",event=>{
    if(event.touches.length===1&&!event.target.closest("a,button")) touchY=event.touches[0].clientY;
  },{passive:true});
  hero.addEventListener("touchmove",event=>{
    if(touchY===null||modalOpen||event.touches.length!==1) return;
    event.preventDefault();const y=event.touches[0].clientY;move((touchY-y)/Math.max(height,1)*2);touchY=y;
  },{passive:false});
  hero.addEventListener("touchend",()=>{touchY=null;},{passive:true});
  hero.addEventListener("touchcancel",()=>{touchY=null;},{passive:true});
  hero.addEventListener("pointermove",event=>{
    if(event.pointerType==="touch"||modalOpen) return;
    pointerX=event.clientX/Math.max(width,1)-.5;pointerY=event.clientY/Math.max(height,1)-.5;
    if(!reduced.matches&&!userPaused) {
      const last=trail[trail.length-1];
      if(!last||Math.hypot(last.x-event.clientX,last.y-event.clientY)>2) trail.push({x:event.clientX,y:event.clientY,time:performance.now()/1000});
      if(trail.length>90) trail.shift();
    }
    requestTick();
  },{passive:true});
  hero.addEventListener("pointerleave",()=>{pointerX=pointerY=0;requestTick();});
  addEventListener("keydown",event=>{
    if(!document.documentElement.classList.contains("flight-enabled")||modalOpen||event.ctrlKey||event.metaKey||event.altKey||event.target.closest("input,textarea,select,[contenteditable]")) return;
    if(!$("[data-drawer]")?.hidden) return;
    if(event.key==="Home"||(event.key==="Escape"&&blendTarget)) {event.preventDefault();home();return;}
    if(event.key==="End") {event.preventDefault();enter(entries.length-1);return;}
    const key=event.key;
    if(key===" "&&event.target.closest("a,button")) return;
    let delta;
    if(key==="ArrowDown"||key==="ArrowRight") delta=.35;
    else if(key==="ArrowUp"||key==="ArrowLeft") delta=-.35;
    else if(key==="PageDown"||key===" ") delta=event.shiftKey?-.8:.8;
    else if(key==="PageUp") delta=-.8;
    if(delta!==undefined) {event.preventDefault();if(!blendTarget&&delta<0) return;move(delta);}
  });
  const ro="ResizeObserver" in window?new ResizeObserver(resize):null;
  ro?.observe(hero);if(!ro) addEventListener("resize",resize);
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden&&frame){cancelAnimationFrame(frame);frame=0;}else {previous=0;requestTick();}
  });
  reduced.addEventListener("change",syncToggles);
  resize();syncToggles();setActive(0);
  function prepareField(force2d=false) {
    window.BlueFluteField.create($("#studio-field"),entries.map(entry=>"assets/img/"+entry.image),{force2d}).then(result=>{
      if(destroyed){result.destroy();return;}
      renderer=result;hero.dataset.fieldRenderer=result.type;hero.classList.add("field-ready");resize();
      result.canvas.addEventListener("field-unavailable",()=>{
        renderer?.destroy();hero.classList.remove("field-ready");prepareField(true);
      },{once:true});
    }).catch(()=>{hero.dataset.fieldRenderer="static";});
  }
  prepareField();
  const hash=location.hash.slice(1);
  if(["work","services","studio","contact","process"].includes(hash)) openPanel(hash);
  addEventListener("pagehide",event=>{
    if(frame) cancelAnimationFrame(frame);frame=0;
    if(event.persisted) return;
    destroyed=true;clearInterval(clockTimer);ro?.disconnect();renderer?.destroy();
  });
  addEventListener("pageshow",event=>{if(event.persisted){previous=0;updateClock();resize();requestTick();}});
})();
