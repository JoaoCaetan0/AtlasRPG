async function noteView() {
  target = me.id;
  let saved = "";
  $("#workspace-content").innerHTML =
    `<h2>Caderno pessoal</h2><p>Visível para o jogador e os mestres.</p><label>Caderno de<select id="note-owner">${(isMaster() ? members : [me]).map((m) => `<option value="${m.id}" ${m.id === me.id ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select></label><textarea id="note" aria-label="Anotações"></textarea><div class="row sheet-actions"><button id="save">Salvar</button><button id="history" class="secondary">Histórico</button><span id="note-status"></span></div>`;
  async function load() {
    const r = await api("note", { table_id: active.id, user_id: target });
    revision = r.revision;
    saved = r.body;
    $("#note").value = saved;
    dirty = false;
    $("#note-status").textContent = "Versão " + revision;
  }
  $("#note-owner").onchange = () =>
    act(async () => {
      const next = $("#note-owner").value;
      if (!canLeave()) {
        $("#note-owner").value = target;
        return;
      }
      target = next;
      await load();
    });
  $("#note").oninput = () => {
    dirty = $("#note").value !== saved;
    $("#note-status").textContent = dirty ? "Alterações não salvas" : "Salvo";
  };
  $("#save").onclick = () =>
    act(async () => {
      const body = $("#note").value;
      const r = await api("note", {
        table_id: active.id,
        user_id: target,
        body,
        revision,
      });
      revision = r.revision;
      saved = body;
      dirty = $("#note").value !== body;
      $("#note-status").textContent = "Salvo • versão " + revision;
    });
  $("#history").onclick = () =>
    act(async () => {
      const rows = await api("note-history", {
        table_id: active.id,
        user_id: target,
      });
      $("#dialog-title").textContent = "Últimas 30 versões";
      $("#dialog-body").innerHTML =
        rows
          .map(
            (r) =>
              `<article class="card"><h3>Versão ${r.revision} · ${esc(r.editor)}</h3><pre>${esc(r.body)}</pre><button data-restore="${r.revision}">Carregar no editor</button></article>`,
          )
          .join("") || "<p>Nenhuma versão salva.</p>";
      $("#dialog").showModal();
      document.querySelectorAll("[data-restore]").forEach(
        (b) =>
          (b.onclick = () => {
            if (dirty && !confirm("Substituir o rascunho?")) return;
            $("#note").value = rows.find(
              (r) => r.revision === Number(b.dataset.restore),
            ).body;
            dirty = true;
            $("#note-status").textContent =
              "Versão carregada. Clique em Salvar.";
            $("#dialog").close();
          }),
      );
    });
  await load();
}
async function chatView(root = $("#chat-slot")) {
 const $=s=>root.querySelector(s),tid=active.id;
 root.innerHTML=`<div class="chat-history-tools"><button id="older" class="secondary" title="Carregar mensagens anteriores">Anteriores</button><button id="chat-live" class="secondary" hidden>Voltar às recentes</button><span id="chat-status" role="status"></span></div><div id="chat-log" role="log" aria-label="Mensagens da mesa"></div><button id="chat-unread" class="secondary" hidden>Novas mensagens ↓</button><form id="chat"><div class="chat-input-row"><textarea name="body" rows="1" maxlength="4000" required aria-label="Mensagem" placeholder="Mensagem ou /r 1d20"></textarea><button class="chat-send" type="submit" title="Enviar (Enter)" aria-label="Enviar mensagem"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></button></div><p class="chat-send-status" role="status"></p><details class="chat-options"><summary>Opções</summary><label>Visibilidade dos dados<select name="scope"><option value="public">Mesa</option><option value="gm">Mestres e você</option><option value="self">Somente você</option></select></label><small>Enter envia · Shift+Enter quebra a linha. /r 1d20+3 | Descrição</small>${isMaster()?'<button id="clear-chat" class="danger" type="button">Apagar mensagens</button>':''}</details></form>`;
 const log=$('#chat-log'),form=$('#chat'),input=form.elements.body,send=$('.chat-send');let first='',before='',loading=false,queued=false,busy=false,last='',seen=null,unread=0,attempt=null,following=true;
 const badge=document.querySelector('[data-tab="chat"]');let count=badge?.querySelector('.chat-badge');if(badge&&!count){count=document.createElement('span');count.className='chat-badge';count.hidden=true;badge.append(count);}
 const bottom=()=>log.scrollHeight-log.scrollTop-log.clientHeight<48;
 function notify(){if(count){count.hidden=!unread;count.textContent=unread>99?'99+':String(unread);badge.setAttribute('aria-label',unread?'Conversa · '+unread+' novas mensagens':'Conversa');}$('#chat-unread').hidden=!unread;}
 function mark(){if(currentPanel==='chat'&&!before&&bottom()){unread=0;notify();}}
 const panel=e=>{if(e.detail==='chat')requestAnimationFrame(()=>{if(following&&!before)log.scrollTop=log.scrollHeight;mark();});};window.addEventListener('atlas-panel',panel);log.addEventListener('scroll',()=>{if(currentPanel==='chat'){following=bottom();mark();}});
 async function update(){if(!root.isConnected)return;if(loading){queued=true;return;}loading=true;
  try{const page=before;const rows=await api('chat-events?table_id='+tid+(page?'&before='+encodeURIComponent(page):''));if(!root.isConnected)return;if(page!==before){queued=true;return;}
   const stamp=JSON.stringify(rows),atBottom=currentPanel==='chat'?bottom():following,ids=new Set(rows.map(r=>r.kind+':'+r.id));
   if(!page){if(seen){const fresh=rows.filter(r=>!seen.has(r.kind+':'+r.id)&&r.user_id!==me.id).length;if(currentPanel!=='chat'||!atBottom)unread+=fresh;}seen=ids;}
   if(last!==stamp){first=rows[0]?.cursor||'';$('#older').disabled=rows.length<100;
    const existing=new Map([...log.children].map(n=>[n.dataset.event,n]));const fragment=document.createDocumentFragment();
    for(const r of rows){const id=r.kind+':'+r.id;let node=existing.get(id);if(!node){const wrapper=document.createElement('div');wrapper.innerHTML=r.kind===1?rollCard(r):`<article class="message ${r.user_id===me.id?'mine':''}"><header><strong>${esc(r.name)}</strong><time>${new Date(r.created*1000).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</time></header><p>${esc(r.body)}</p></article>`;node=wrapper.firstElementChild;node.dataset.event=id;}fragment.append(node);}
    const scroll=log.scrollTop;log.replaceChildren(fragment);if(!rows.length)log.innerHTML='<p class="empty">Comece a conversa.</p>';if((atBottom||!last)&&!page)log.scrollTop=log.scrollHeight;else log.scrollTop=scroll;last=stamp;
   }
   $('#chat-live').hidden=!before;$('#chat-status').textContent=before?'Histórico':'';notify();mark();
  }catch(e){if(root.isConnected)$('#chat-status').textContent='Reconectando…';}finally{loading=false;if(queued){queued=false;update();}}
 }
 input.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();if(input.value.trim()&&!busy)form.requestSubmit();}};
 input.oninput=()=>{input.style.height='auto';input.style.height=Math.min(96,input.scrollHeight)+'px';};
 log.onclick=e=>{const b=e.target.closest('.reuse-roll');if(b){input.value='/r '+b.dataset.expression+(b.dataset.label?' | '+b.dataset.label:'');form.elements.scope.value=b.dataset.scope;input.focus();input.oninput();}};
 form.onsubmit=async e=>{e.preventDefault();if(busy||!input.value.trim())return;busy=true;send.disabled=true;const body=input.value,scope=form.elements.scope.value,signature=JSON.stringify([body,scope]);if(!attempt||attempt.signature!==signature)attempt={signature,id:'chat-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)};
  try{$('.chat-send-status').textContent='';await api('chat',{table_id:tid,body,scope,request_id:attempt.id});attempt=null;if(!root.isConnected)return;if(input.value===body){input.value='';input.oninput();}before='';last='';await update();log.scrollTop=log.scrollHeight;mark();input.focus();}catch(e){if(root.isConnected)$('.chat-send-status').textContent=e.message;}finally{busy=false;send.disabled=false;}
 };
 $('#older').onclick=()=>{if(first){before=first;last='';update();}};
 $('#chat-live').onclick=$('#chat-unread').onclick=()=>{before='';last='';unread=0;notify();update().then(()=>{log.scrollTop=log.scrollHeight;});};
 if(isMaster())$('#clear-chat').onclick=async()=>{if(!confirm('Apagar as mensagens? As rolagens serão preservadas.'))return;try{await api('clear-chat',{table_id:tid});before='';last='';await update();}catch(e){$('.chat-send-status').textContent=e.message;}};
 const dispose=watchTable(root,async()=>{if(!before)return update();const rows=await api('chat-events?table_id='+tid);if(!root.isConnected)return;if(!before)return update();const ids=new Set(rows.map(r=>r.kind+':'+r.id));if(seen)unread+=rows.filter(r=>!seen.has(r.kind+':'+r.id)&&r.user_id!==me.id).length;seen=ids;notify();},['chat','rolls']);const observer=new MutationObserver(()=>{if(!root.isConnected){dispose();observer.disconnect();window.removeEventListener('atlas-panel',panel);}});observer.observe(document.body,{childList:true,subtree:true});await update();
}
async function memberView() {
  $("#workspace-content").innerHTML =
    `<h2>Participantes</h2><div class="card">${members.map((m) => `<div class="row toolbar"><strong>${esc(m.name)}</strong><small>${esc(m.role)}</small>${active.role === "owner" && m.id !== me.id ? `<button data-role="${m.id}" data-next="${m.role === "gm" ? "player" : "gm"}" class="secondary">${m.role === "gm" ? "Tornar jogador" : "Tornar mestre"}</button>` : ""}${isMaster() && m.id !== me.id && m.role !== "owner" && (active.role === "owner" || m.role === "player") ? `<button data-remove="${m.id}" class="danger">Remover e bloquear</button>` : ""}</div>`).join("")}</div>${isMaster() ? '<div class="card"><h2>Convites</h2><button id="invite">Gerar convite • 7 dias</button> <button id="revoke" class="secondary">Revogar convites</button><p id="code"></p><h2>Bloqueados</h2><div id="blocked"></div></div>' : ""}`;
  async function reload() {
    members = await api("members?table_id=" + active.id);
    await memberView();
  }
  document.querySelectorAll("[data-role]").forEach(
    (b) =>
      (b.onclick = () =>
        act(async () => {
          await api("role", {
            table_id: active.id,
            user_id: b.dataset.role,
            role: b.dataset.next,
          });
          await reload();
        })),
  );
  document.querySelectorAll("[data-remove]").forEach(
    (b) =>
      (b.onclick = () =>
        act(async () => {
          if (!confirm("Remover e bloquear este participante?")) return;
          await api("remove-member", {
            table_id: active.id,
            user_id: b.dataset.remove,
            block: true,
          });
          await reload();
        })),
  );
  if (isMaster()) {
    $("#invite").onclick = () =>
      act(async () => {
        const r = await api("invite", { table_id: active.id });
        $("#code").textContent =
          location.origin + "/#invite=" + r.code + "  · Código: " + r.code;
      });
    $("#revoke").onclick = () =>
      act(async () => {
        await api("revoke-invites", { table_id: active.id });
        $("#code").textContent = "Convites revogados.";
      });
    const banned = await api("blocked?table_id=" + active.id);
    $("#blocked").innerHTML =
      banned
        .map(
          (m) =>
            `<p>${esc(m.name)} <button data-unblock="${m.id}">Desbloquear</button></p>`,
        )
        .join("") || "<p>Nenhum bloqueio.</p>";
    document.querySelectorAll("[data-unblock]").forEach(
      (b) =>
        (b.onclick = () =>
          act(async () => {
            await api("unblock", {
              table_id: active.id,
              user_id: b.dataset.unblock,
            });
            await reload();
          })),
    );
  }
}
