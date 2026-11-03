# Atlas V15 — Plano e retomada

Base: V14.2 (UTF-8 explícito, carregamento ordenado e recuperação do combate). A tentativa isolada de enquadramento anterior foi relatada como insuficiente pelo usuário. Banco continua no esquema 8. Uso local/LAN/Radmin; GitHub pausado; dados ficam para uma rodada posterior.

## Estado em 03/11/2026
CP0: especificação registrada neste documento.
CP1: concluído. Usuário confirmou o enquadramento corrigido.
CP2a: concluído (zoom +/− e catálogo). CP2b: troca rápida de horário concluída para versões alinhadas sem estados independentes conflitantes. CP3: concluído no combate; integração visual de condições na ficha segue em CP5. CP4 a CP6: pendentes. Não confundir habilidades automáticas da V13 com nova implementação.

## CP1 — Câmera
Módulo web/combat/camera.mjs mantém zoom local separado do combate compartilhado. Superfície recebe largura E altura explícitas; SVG ocupa 100% de ambas; camadas de acessos acompanham a mesma superfície. Escala usa o menor limite entre largura e altura disponíveis. Por padrão abre enquadrado. Zoom manual 25–400% relativo ao enquadramento. Ver mapa inteiro retorna a 100% do enquadramento. ResizeObserver é descartado na troca de cena. Atualizações de combate não recalculam estado de zoom.
Validação: tests/ui_camera.cjs sobe o servidor, faz login, abre mapa alto, aproxima, ativa combate sem perder zoom, enquadra, redimensiona para celular e troca para mapa largo. Não usa campanha real: fixture cria imagens locais de teste. Passou em Chromium. Windows/Radmin real ainda não testado nesta etapa.

## CP2 — Mapas
Busca sem acentos/caixa; Todos/Regionais/Encontros; etiquetas, favoritos, recentes; classificação editável. Prévia privada separada de mostrar aos jogadores. Horários disponíveis na cena. Antes de troca rápida de horário, separar identidade da cena de asset_id: atualmente combates são por asset_id e névoa por digest. Migração deve preservar estados preexistentes e resolver conflitos sem apagar posições ou revelar névoa. Conferir alinhamento entre imagens; versões sem alinhamento não podem simplesmente compartilhar coordenadas.

## CP3 — Condições e mortos
Busca, lista compacta com ícone e nome, resumo, aplicadas primeiro; detalhes expansíveis, estágios/segredo contextual. Ícones vetoriais originais coloridos/contrastantes, não apenas emojis ou cores. Mesmo catálogo no token/iniciativa/ficha. Marcar morto com X vermelho cobrindo miniatura; reversível, persistente, sincronizado, respeitando visibilidade. Não alterar PV/excluir ficha automaticamente. Opção de pular mortos na iniciativa. Testar permissões e desfazer.

## CP4 — Desenhos
Ícone lateral; caneta, marca-texto, linha, seta, retângulo, elipse, triângulo, polígono; contorno, preenchimento, espessura e transparência. Selecionar/mover/redimensionar/apagar; desfazer/refazer; salvar por cena; desenho privado do mestre ou compartilhado, respeitando névoa; jogador somente próprios desenhos quando autorizado. Uma ferramenta ativa por vez; Esc encerra; não mover token enquanto desenha.

## CP5 — Fichas e lótus
Seções Identidade/Lótus/Recursos e defesa/Habilidades/Equipamentos/Anotações; eliminar campos duplicados e manter salvar/PDF acessíveis. Verificar habilidades de raça/classe já importadas, preservar manuais, evitar duplicatas. Consultar páginas VISUAIS do livro no Canva para valores e disposição da lótus por classe; texto extraído não confirma diagramas. Não inferir valores. Atributos editáveis livremente pelo jogador, modelo inicial por classe, sem sobrescrita em salvar/reabrir. Reaplicar modelo somente por ação deliberada. Troca de classe com atributos já editados deve preservar ou permitir decisão explícita. Mobile com campos tocáveis.

## CP6 — Consolidação
Testes integrados mestre/jogador, atualização sobre banco anterior, importação dos arquivos existentes e pacote completo com campanha. Preservar data/. Versão visível, favoritos/busca mantidos, feedback de gravação/reconexão, barra contextual de token e tela cheia/recolher painéis. Atalhos não interceptam texto. Nenhuma promessa de novo mecanismo de dados nesta rodada.

## Referências da revisão
https://docs.owlbear.rodeo/docs/managing-assets/
https://foundryvtt.com/article/tokens/
https://foundryvtt.com/article/drawings/
https://roll20partners.zendesk.com/hc/en-us/articles/10269526917783-Token-Marker-Set-Guidelines

## Retomar
Começar lendo este documento e docs/ATUALIZACAO_V15_CP1.md. Último pacote contém código completo e tokens, sem campaign/ nem data/. Recuperar mapas dos três ZIPs V14 completos apenas se necessário, sem sobrescrever código novo. Manter UTF-8 explícito. Ao concluir cada etapa atualizar status, testes, limitações e salvar pacote persistente. Próximo trabalho: CP2 e desenho da migração de cenas/horários.

## Checkpoint CP2a — 03/11/2026
Botões + e − com passo de 25 pontos percentuais, limites de 25–400%, estado desabilitado nos limites; controle deslizante e enquadramento mantidos.
Catálogo com busca sem acentos por palavras em nome/região/etiquetas, filtros de tipo, favoritos, recentes e contagem. Preferências locais isoladas por usuário e mesa; versão selecionada permanece. Prévia privada e mostrar aos jogadores são ações distintas.
Administração permite tipo explícito e até 20 etiquetas. Cadastros antigos permanecem não classificados; não adivinhar tipo por nome. Não houve alteração de esquema nem migração de dados.
Metadados continuam restritos aos mestres pela política existente: filtros de tipo/região/etiquetas são úteis no catálogo do mestre; jogadores não recebem notas privadas.
Validação: suíte Python e teste Chromium ui_camera.cjs, incluindo botões, enquadramento, zoom preservado no combate, celular, busca de Árvores sem acento, favoritos, filtro regional e persistência de filtros.
Próxima etapa após CP2a: CP2b (concluída abaixo); agora seguir CP3.

## Checkpoint CP2b — 03/11/2026
Horário na barra da cena para o mestre, com apenas versões cadastradas. Primeira vinculação pede confirmação visual de mesma planta/enquadramento, compara proporções no servidor e mostra ambas as imagens. As seguintes são diretas.
scene_variants.py cria identidade de camadas compartilhada; combate e histórico usam combat_asset; névoa resolve digest canônico inclusive no endpoint de imagem mascarada. Não há cópia divergente de estado entre horários. Originais e estados legados não são apagados.
Toda alteração é transacional; conflito de revisão, permissões, proporções incompatíveis, imagens compartilhadas com outro mapa e estados independentes no destino bloqueiam a operação sem publicação parcial. Estados independentes podem ser abertos pelo catálogo; mesclagem desses estados ainda não implementada.
Esquema sobe de 8 para 9. Instalações antigas recusam abrir banco novo; não voltar versão sem restaurar backup anterior.
Mestre e jogador recebem a nova imagem pelo mecanismo existente de atualização automática. Câmera reenquadra ao trocar imagem; zoom +/− continua disponível.
Validação: testes de servidor de ida/volta, histórico, gasto, iniciativa, máscara de pixels para jogador, permissões, reinício, revisões e estados preexistentes. Chromium com duas sessões verifica troca sem reload e tokens persistentes. Regressão do enquadramento e catálogo aprovada.
Retomar: CP3 — condições pesquisáveis/ícones e token Morto; CP4 desenhos; CP5 fichas/lótus; CP6 consolidação.

## Checkpoint CP3 — 03/11/2026
Condições: busca sem acentos, resumo compacto, regra completa expansível, condições já aplicadas primeiro ao abrir, estágio/visibilidade apenas em opções selecionadas. Filtrar esconde linhas sem apagar seleções.
Pictogramas SVG coloridos para as 28 condições do catálogo atual, compartilhados entre seletor, token e iniciativa. Cor configurada respeitada; ícones textuais personalizados continuam funcionando. Integração visual com ficha permanece para CP5.
Morto é propriedade opcional booleana do token; X vermelho cobre miniatura. Não altera PV/ficha nem exclui token. Alternância pelo painel Tokens e condições, nome visível na iniciativa, atualização automática e histórico. Tokens antigos sem dead continuam válidos. Opção Pular tokens mortos no avanço de turnos; ordem não é removida.
Validação: testes de servidor para permissões, persistência, névoa, desfazer/refazer e histórico antigo; navegador mestre/jogador para busca sem acento, múltiplas seleções entre filtros, ícones, morto e pular turnos.
Banco continua no esquema 9 (CP2b). Este pacote inclui CP2b, que só tinha sido entregue por link temporário devido à falha de envio persistente.
Próxima etapa: CP4 desenhos. Depois CP5 fichas/lótus e CP6 consolidação. Não afirmar que o projeto inteiro está concluído.

## Nova prioridade — 03/11/2026, após validação do usuário
O usuário validou as atualizações e pediu SOMENTE ORGANIZAR a próxima versão. Especificação em PROXIMA_VERSAO_UI_COMBATE.md: barra superior de abas, Grid separado, cards de condições em cinco colunas e iniciativa com entradas opcionais/repetidas e janela flutuante individual. Nenhum código ou banco foi alterado nesta preparação. Próxima implementação: UI-1 a UI-4 desse documento, antes de CP4 desenhos. Demais pendências preservadas.

Revisão 2 do plano UI: direção visual, layouts responsivos, interação sem deslocamento do mapa, cards acessíveis, fila com null/zero e duplicatas, janela local, critérios de testes e referências adicionados a PROXIMA_VERSAO_UI_COMBATE.md. Próxima ação executável: UI-1; ainda nenhum código alterado nesta revisão.

## UI-1 implementado — 03/11/2026
Barra superior com seis ferramentas para mestre, remoção de duplicatas laterais, Grid/Condições/Iniciativa em painéis próprios. Reutiliza controles e ações existentes. Layout desktop ancorado à esquerda e móvel inferior. Enquadramento/zoom testados. UI-2 cards, UI-3 nova fila e UI-4 janela flutuante permanecem pendentes. Próxima implementação: UI-2.

## Lote UI-2 a UI-4 — 03/11/2026
Concluídos: cards pesquisáveis e coloridos para token selecionado, alternância direta, detalhes/estágio/sigilo; iniciativa com valor null ou zero distinto, entradas repetidas e independentes, reordenação por arraste e controles existentes por teclado; janela flutuante local com mover/minimizar/fechar/reabrir/restaurar posição. Novo módulo combat-panels.mjs. Banco esquema 10 para proteger compatibilidade de iniciativas sem valor. Preserva regras anteriores de reposição de movimento ao iniciar cada participação.
Testes: ui_batch.cjs duas contas, toggle, duplicatas, null/zero, arraste, entrada sem token, fechamento local, minimizar/mover; ui_period.cjs horários; ui_toolbar.cjs câmera/catálogo; suíte Python. Próxima etapa: CP4 desenhos, depois CP5 fichas/lótus.

## CP4a — 03/11/2026
Visual de abas e cards estendido aos atalhos e painéis da direita. Desenhos do mestre: caneta, linha, seta, retângulo, elipse e triângulo, cor, espessura, privado/compartilhado, exclusão por lista. Persistência no estado canônico de combate, incluindo horários vinculados e histórico de desfazer/refazer. Servidor omite desenhos privados e inteiros cujo retângulo envolvente com margem de traço cruza névoa. Esquema 11 impede retorno a servidor sem esse filtro.
Validação: 47 testes Python (2 ignorados por arquivos ausentes), ui_drawings.cjs com duas contas, suíte ui_batch.cjs de combate.
CP4 ainda não completo: mover/redimensionar desenhos, preenchimento/opacidade, marca-texto, polígono e autorização de jogadores para desenhar pendentes. Próxima etapa é CP4b, antes de fichas/lótus.

## CP4b — 03/11/2026
Desenhos: mover/redimensionar seleção por arraste, estilo editável (cor, espessura, preenchimento, opacidade, privado), marca-texto 30% e polígono por vértices com Enter/Fechar. Esc cancela. Estilo antigo assume opacidade 1 e sem preenchimento. Transformações limitadas ao mapa; comparação do original impede sobrescrever desenho alterado durante arraste. Banco esquema 12. Testes de navegador e servidor. Próximo CP4c: autorização de jogadores, propriedade dos desenhos e operações próprias no servidor. Depois CP5 fichas/lótus e consolidação.
