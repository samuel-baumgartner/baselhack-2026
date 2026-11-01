const slides = [...document.querySelectorAll('.slide')];
const counter = document.querySelector('#counter');
const notes = document.querySelector('#presenter');
const overview = document.querySelector('#overview');
let index = Math.min(slides.length - 1, Math.max(0, (parseInt(location.hash.slice(1), 10) || 1) - 1));
let started = null, elapsed = 0, ticker = null;
const names = ['Channel3','Jinko','Allowance','Palisade','Kinect','Pango','Rye','Zinc','Firmly','Crossmint','Wizard','Daydream','Phia','Skyfire','AgentCash','Yuno'];
names.forEach((name, i) => {
  const el = document.createElement('span'); el.className = 'company'; el.textContent = name;
  const col = i % 4, row = Math.floor(i / 4);
  el.style.cssText = `left:${5 + col * 25}%;top:${12 + row * 24}%;--delay:${i * .13}s;--alpha:${.45+(i%3)*.12};font-size:${2.5+(i%3)*.3}vw`;
  document.querySelector('.word-cloud').append(el);
});
slides.forEach((slide, i) => {
  const button = document.createElement('button'); button.className = 'overview-item';
  const img = slide.querySelector('img'); if(img) { const preview = img.cloneNode(); preview.alt = ''; button.append(preview); }
  const num = document.createElement('span'); num.textContent = `${String(i+1).padStart(2,'0')} / ${slide.dataset.time}s`;
  const title = document.createElement('strong'); title.textContent = slide.dataset.title;
  button.append(num,title); button.addEventListener('click',()=>{overview.close();show(i);}); document.querySelector('#overview-grid').append(button);
});
function show(next, allRevealed = false) {
  index = Math.max(0,Math.min(slides.length-1,next));
  slides.forEach((slide,i)=>{slide.classList.toggle('active',i===index);slide.setAttribute('aria-hidden',String(i!==index));slide.inert=i!==index;if(i!==index)slide.querySelectorAll('.fragment').forEach(f=>f.classList.remove('visible'));});
  if(allRevealed)slides[index].querySelectorAll('.fragment').forEach(f=>f.classList.add('visible'));
  document.body.classList.toggle('blank-active',slides[index].classList.contains('blackout'));
  counter.textContent = `${String(index+1).padStart(2,'0')} / ${slides.length}`;
  document.querySelector('.brand-home').style.visibility=index<slides.findIndex(slide=>slide.classList.contains('prism-slide'))?'hidden':'visible';
  document.querySelector('#progress').style.width = `${(index+1)/slides.length*100}%`;
  document.querySelector('#note-title').textContent = `${index+1}. ${slides[index].dataset.title}`;
  document.querySelector('#note-text').textContent = slides[index].dataset.note;
  document.querySelector('#slide-budget').textContent = `Slide budget: ${slides[index].dataset.time}s`;
  document.querySelectorAll('.overview-item').forEach((el,i)=>el.classList.toggle('current',i===index));
  history.replaceState(null,'',`#${index+1}`);
  document.title = `Prism · ${document.body.dataset.deckVersion.toUpperCase()} · ${index+1}/${slides.length} · ${slides[index].dataset.title}`;
}
function next(){const fragment=slides[index].querySelector('.fragment:not(.visible)');if(fragment){fragment.classList.add('visible');return;}show(index+1);}
function previous(){const fragments=[...slides[index].querySelectorAll('.fragment.visible')];if(fragments.length){fragments.at(-1).classList.remove('visible');return;}show(index-1,true);}
function toggleNotes(){notes.hidden=!notes.hidden;}
function toggleOverview(){overview.open?overview.close():overview.showModal();}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{document.body.classList.toggle('hide-controls');}}
function updateTimer(){const seconds=Math.floor((elapsed+(started?Date.now()-started:0))/1000);const timer=document.querySelector('#timer');timer.textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} / 3:00`;timer.classList.toggle('overtime',seconds>180);}
document.querySelector('#timer-toggle').onclick=()=>{if(started){elapsed+=Date.now()-started;started=null;clearInterval(ticker);}else{started=Date.now();ticker=setInterval(updateTimer,250);}document.querySelector('#timer-toggle').textContent=started?'Pause rehearsal':'Resume rehearsal';updateTimer();};
document.querySelector('#timer-reset').onclick=()=>{elapsed=0;started=null;clearInterval(ticker);document.querySelector('#timer-toggle').textContent='Start rehearsal';updateTimer();};
document.querySelector('#next').onclick=next;document.querySelector('#previous').onclick=previous;
document.querySelector('#notes-toggle').onclick=toggleNotes;document.querySelector('#close-notes').onclick=toggleNotes;
document.querySelector('#overview-toggle').onclick=toggleOverview;document.querySelector('#close-overview').onclick=()=>overview.close();document.querySelector('#fullscreen').onclick=fullscreen;
document.querySelector('#deck-switcher').addEventListener('change',event=>{location.href=event.target.value;});
document.addEventListener('keydown',event=>{if(event.target.closest('select'))return;if(event.target.closest('button,a,input,textarea')&&[' ','Enter'].includes(event.key))return;if(overview.open){if(event.key.toLowerCase()==='o')overview.close();return;}switch(event.key){case'ArrowRight':case'ArrowDown':case' ':case'PageDown':event.preventDefault();next();break;case'ArrowLeft':case'ArrowUp':case'PageUp':event.preventDefault();previous();break;case'Home':show(0);break;case'End':show(slides.length-1);break;case'n':case'N':toggleNotes();break;case'o':case'O':toggleOverview();break;case'f':case'F':fullscreen();break;case'h':case'H':document.body.classList.toggle('hide-controls');break;case'Escape':notes.hidden=true;break;}});
document.querySelector('#deck').addEventListener('click',event=>{if(!event.target.closest('a,button'))next();});
let touchX=null;document.addEventListener('touchstart',event=>{if(!event.target.closest('aside,dialog,button,a'))touchX=event.changedTouches[0].clientX;},{passive:true});document.addEventListener('touchend',event=>{if(touchX===null)return;const delta=event.changedTouches[0].clientX-touchX;touchX=null;if(Math.abs(delta)>60){event.preventDefault();delta<0?next():previous();}},{passive:false});
window.addEventListener('hashchange',()=>show((parseInt(location.hash.slice(1),10)||1)-1));
show(index);
