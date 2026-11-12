# Reestruturação Atlas — plano persistente

Base: V16 CP13.1. Primeiro lote: CP14. Não substituir o Atlas nem suas regras.

## Arquitetura encontrada antes das alterações

Python HTTPServer/ThreadingHTTPServer, SQLite WAL, módulos de domínio (`features`, `combat`, `characters`, `fog`, `token_vision`, `saved_tokens`, `token_resources`). `Handler.route` autentica e resolve participação/cargo; mutações são transacionais; `after_write` publica invalidações após commit. WebSocket Sans-I/O com SSE/HTTP de recuperação. Sem framework frontend: scripts globais carregados em ordem e módulos ES para câmera, renderização SVG, biblioteca, desenho e menus de token.

`workspace.js` controla uma única gaveta e preserva a cena. `combat.js` orquestra estado versionado, renderização e assinaturas; câmera é local. `session.js` compartilha o componente de dados. `characters.js` e `system-profiles.js` têm dois editores de ficha e um terceiro fluxo de PDF genérico. `openTokenMaker` é compartilhado entre personagens, biblioteca e NPCs. Estilo acumulado em `style.css` tem sobrescritas conflitantes; refatorar por domínio, sem reescrever tudo de uma vez.

A imagem filtrada do jogador é produzida no servidor; nunca enviar o mapa integral oculto ao cliente para acelerar. `vision_memory` está indexada por mesa, digest do mapa e jogador. B2 exige migração para memória por token; não implementar como simples DELETE da memória do jogador.

## Ordem e dependências

| Lote | Escopo | Dependências / aceite |
|---|---|---|
| CP14 — estabilização | D1 upload, D2 dados, A1 notificações, C3 retorno ao salvar; B3 acesso a painéis; início A4 | Reproduzir limite de upload; corrigir sem perder retrato anterior; controles acessíveis; não alterar regras |
| CP15 — estrutura de painéis | A2 ordem individual, A3 minimizar/preservar rascunho, completar A4; C1 tokens salvos dentro de Personagens | Componente comum de gaveta; teclado e toque; validar foco, 320 px e zoom 200%; não duplicar ações |
| CP16 — interação e permissões | B1 indicador, B4 botão direito com limiar, B5 PV/PD e visibilidade; C2 auditoria/migração do combate | Preservar câmera/movimento/contextmenu; permissões no servidor; nenhum recurso de combate removido sem destino |
| CP17 — memória isolada | B2 reset por token e mapa | Esquema versionado e teste com dois tokens do mesmo jogador; preservar memória antiga; confirmação; atual diferente de explorado |
| CP18 — medições e otimização | E1/E2/E3 | Instrumentar etapas reais antes de definir metas; separar transferência, decode, raster de névoa e render; vários clientes e reconexão; comparar antes/depois |
| CP19 — fichas amplas | F1/F2 recebidos, finalizar C1/C3 integração | Inventário de campos reais; cards/seções, desktop 90–95%, celular tela cheia; preservar fórmulas, habilidades, PDF e valores; salvar/cancelar e foco |

Os lotes podem ser ajustados por evidência. Cada entrega precisa de ZIP cumulativo, testes, mudanças, limitações e próximo ponto exato de retomada. A solicitação recebida termina no meio de F2; não presumir requisitos posteriores não recebidos.

## Matriz de testes

Servidor: mestre/jogador/não membro; mesmo jogador com múltiplos tokens; corpo grande/malformado; conflito de revisão; persistência; rollback; eventos pós-commit. Frontend: estados carregando/salvando/erro, foco por teclado, clique versus arrasto, restauração de painel, ausência de seleção de texto. Visual: desktop, 1366×768, 390×844, largura 320 e zoom 200%, formulário longo, muitos dados.

Desempenho: medir local e Radmin separadamente; não anunciar latência LAN a partir de loopback. Não existe medição real da rede do usuário neste ambiente.

## Referências consultadas

- WAI/APG Dialog: foco inicial, contenção do foco, fechamento e retorno — https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- WAI Focus Not Obscured: ações fixas não podem esconder campos focados — https://w3c.github.io/wcag/understanding/focus-not-obscured-minimum.html
- Foundry Actors/Player Orientation: diretório de personagens separado da ficha e edição durante a cena — https://foundryvtt.com/article/actors/ e https://foundryvtt.com/article/player-orientation/
- MDN Resource Timing: medir bytes e tempos distinguindo cache — https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/decodedBodySize

## Diagnóstico inicial confirmado

D1: `/api/character-portrait` aceita PNG base64 de até 3 MiB no domínio, mas o adaptador HTTP rejeita acima de 65536 bytes antes de chegar nele. PNG de foto/textura pode exceder esse limite; imagens uniformes dos testes antigos não o excediam. Resposta 413/rejeição antecipada pode aparecer como falha de fetch no navegador.
D2: CP13 removeu a coluna de histórico e mudou `.dice-layout` para block, mantendo height:100% e overflow:hidden no slot/layout. O formulário longo perdeu uma altura delimitada para sua própria rolagem.
A1: `#notice` recebe mensagens de muitos módulos; usar adaptador de notificações, não apagar o nó e quebrar consumidores.
C3: salvar padrão apenas troca mensagem; PDF export também chama save. Retornar à lista só no envio normal, sem quebrar salvar-e-exportar.

## Atualização CP15
A2 implementado: ordem individual no navegador, por usuário, com arraste, Alt+setas, organizador por botões e restauração. Não sincroniza a preferência entre dispositivos.
A3 implementado no ciclo atual: minimização preserva DOM, rascunho e rolagem; etiqueta reabre; ferramentas dedicadas não descartam a ficha. Alternar entre duas páginas genéricas com alterações ainda pede confirmação. Não há recuperação de rascunhos após fechar/recarregar o navegador.
C1 implementado: aba Tokens salvos em Personagens; acesso lateral independente removido; rota interna antiga redireciona. Arraste, inclusão, pesquisa e exclusão preservados; Atualizar busca modelos criados durante a cena.
A4 continua parcial: navegador de testes não inicia neste ambiente. Inspeção visual em desktop/móvel/zoom é pendência explícita antes de expandir layout.

## Atualização CP16
B1/B4/B5 implementados; auditoria C2 concluiu que o menu Combate ainda tem funções necessárias e deve permanecer. Inspeção visual em navegador real pendente. Próxima leva CP17: isolamento e limpeza da memória visual. Não há otimização E nem reformulação F nesta entrega.

## Atualização CP17
B2 implementado: memória isolada, migração única conservadora e limpeza no contexto de Visão. Consulte MEMORIA_VISUAL_CP17.md para isolamento, legado e rollback. Restam CP18 (medição/otimização) e CP19 (ficha ampla), além da validação visual geral pendente.

## Atualização CP18
Usuário validou o restante da CP17. Ajustes extras: retirar organizador dedicado, faixa verde do mapa e corrigir retratos. E1/E2 parcialmente executados: diagnóstico opcional e otimização medida de sight com máscara idêntica. E3 depende de navegador/rede reais; ver DESEMPENHO_CP18.md. Não considerar a etapa de desempenho completa. Próximo lote funcional continua sendo CP19/F, sem alterar regras; medir também o restante de E no primeiro ambiente compatível.


## CP18.1
Refinamento solicitado antes da ficha final: reordenação animada e menos texto nos dados. Não altera o escopo da CP19 nem conclui as medições de rede pendentes.

## CP19 — implementação da ficha ampla
F1/F2: aplicado editor compartilhado amplo com seções, cards, busca, responsividade e ações fixas. Regras e dados mantidos. Validação visual/E2E em navegador ainda bloqueada; consultar CHECKPOINT e FICHAS_CP19. E1–E3 continua parcial conforme CP18. Não declarar todas as etapas encerradas sem essas verificações.

## CP20
Revisão da CP19: proteção de gravações concorrentes e campos durante envio, recuperação após erro, preservação de zero e atualização de roteiros legados. Medição de transporte com dois clientes locais incluída, sem mudança de protocolo. A validação visual e medições reais E seguem pendentes; consultar CHECKPOINT.
