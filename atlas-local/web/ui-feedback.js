// Compatible adapter for legacy notice.textContent producers. No shared room state.
let feedbackHost=null;
function mountFeedback(source){
 if(feedbackHost)return;
 feedbackHost=document.createElement('aside');feedbackHost.className='atlas-toasts';feedbackHost.setAttribute('aria-label','Notificações');document.body.append(feedbackHost);
 source.classList.add('feedback-source');source.removeAttribute('role');
 new MutationObserver(()=>{const text=source.textContent.trim();if(text)showFeedback(text);}).observe(source,{childList:true,characterData:true,subtree:true});
}
function showFeedback(message,kind='info'){
 if(!feedbackHost||!message)return;
 // Keep errors until explicit dismissal; repeated errors reuse their existing toast.
 const existing=[...feedbackHost.children].find(n=>n.dataset.message===String(message));
 if(existing)return;
 const toast=document.createElement('div');toast.className='atlas-toast '+(kind==='error'?'toast-error':'');toast.dataset.message=String(message);
 const text=document.createElement('p');text.setAttribute('role',kind==='error'?'alert':'status');
 const close=document.createElement('button');close.type='button';close.className='secondary';close.textContent='×';close.setAttribute('aria-label','Dispensar notificação');
 toast.append(text,close);feedbackHost.append(toast);text.textContent=String(message);
 let timer;const remove=()=>{clearTimeout(timer);toast.remove();};
 const schedule=()=>{clearTimeout(timer);if(kind!=='error')timer=setTimeout(remove,6000);};
 close.onclick=remove;toast.onmouseenter=()=>clearTimeout(timer);toast.onmouseleave=schedule;toast.onfocusin=()=>clearTimeout(timer);toast.onfocusout=schedule;schedule();
}
