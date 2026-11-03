# Próxima versão — Menus do mapa, condições e iniciativa

Data: 03/11/2026. Estado: ESPECIFICAÇÃO; implementação não iniciada.
Solicitação atual: somente organizar o projeto para retomada posterior. Não alterar código, banco ou versão instalada nesta rodada.
Base validada pelo usuário: V15 CP3. Pacote persistente: Atlas_V15_CP3_Atualizacao_Leve.zip (libfile_f9c543564ea08191b8aba208c99b093b). Preservar enquadramento, zoom, horários vinculados, grade, tokens, condições, histórico e névoa.
Esta etapa entra antes do antigo CP4 (desenhos). Desenhos, fichas/lótus e consolidação permanecem pendentes; dados não recebem novas regras de rolagem aqui.

## 1. Barra horizontal no canto superior esquerdo

Migrar as ferramentas relacionadas ao combate da barra vertical direita para a barra horizontal superior esquerda, sem duplicar os mesmos atalhos nas duas barras.
Ordem proposta: Combate | Grid | Tokens | Condições | Iniciativa | Dados.
Grid deve ser um menu próprio imediatamente ao lado de Combate. Iniciativa deve ter menu próprio junto das ferramentas de combate. Tokens e Dados também passam para essa área.
Manter utilitários gerais (mapas, biblioteca, chat, fichas, participantes, administração) na navegação lateral. Névoa e histórico permanecem onde estão até revisão específica; não migrar outras ferramentas por suposição.
Cada ferramenta parece uma aba/adesivo encaixado na borda superior. Ao passar o mouse, a aba se estica para baixo e revela o nome; clicar abre as opções. Hover não aplica ações nem abre automaticamente configurações extensas.
Painéis sobrepostos ao mapa, sem troca de página e sem recriar o SVG, o timer ou a câmera. Apenas um painel principal da barra aberto por vez. Indicar o menu ativo e permitir recolhê-lo.
Teclado: foco reproduz a indicação do hover, Enter/Espaço abre, Esc recolhe. Toque: clicar abre diretamente. Respeitar preferência de movimento reduzido. Nenhuma função pode depender exclusivamente de hover.
Usar rótulos, ícones, separação visual entre grupos e controles compactos. Evitar repetir ações existentes na barra antiga.

## 2. Condições em cards ligados ao token selecionado

O cabeçalho mostra o nome/miniatura do token selecionado. A seleção no mapa e o menu usam a mesma fonte de estado. Ao selecionar outro token, atualizar cards imediatamente, sem fechar o menu.
Sem token selecionado: mostrar orientação para selecionar um token; cards não podem aplicar condições a um alvo anterior.
Desktop: grupos/linhas de 5 cards, da esquerda para direita. Cada card contém ícone, nome, cor configurada e resumo breve. Busca sem acentos continua disponível. Condições aplicadas têm marca visual e texto/ícone além da cor.
Ao passar o mouse ou focar, o card cresce visualmente para mostrar detalhes sem reorganizar a grade e sem ocultar o card seguinte. Prever limite de altura/área para a regra completa. Em toque, oferecer controle explícito de detalhes, separado da ação aplicar/remover.
Clique no card: alterna a condição no token selecionado e salva diretamente. Segundo clique remove. Não exigir Salvar para a alternância rápida.
Evitar duplo envio e alternâncias acidentais: durante gravação, indicar progresso e impedir ação concorrente no mesmo card. Em conflito de revisão, atualizar e avisar; não aplicar ao token que estava selecionado antes da troca.
Estágio e condição secreta continuam disponíveis em controles próprios, sem que clicar neles alterne o card. Regra completa acessível sem aplicar condição. Cores personalizadas e pictogramas existentes são preservados.
Manter ordem dos cards estável durante cliques para evitar que o próximo clique atinja outra condição; condições aplicadas podem ter filtro próprio. Não reordenar automaticamente a cada alternância.
Em telas estreitas, reduzir colunas para manter legibilidade e controles tocáveis; cinco por linha é a composição desktop, não obrigação de comprimir cards no celular.
Permissões atuais preservadas: jogadores veem apenas condições permitidas. Aplicação/remoção segue autorização de mestre existente; não conceder edição irrestrita ao jogador como consequência da mudança visual.

## 3. Iniciativa simples, com ou sem token

No menu Iniciativa, mostrar o token selecionado e ação Adicionar à fila. O mestre pode clicar no token no mapa, abrir iniciativa e adicioná-lo com valor opcional.
Sem valor: adicionar ao fim da fila. Com valor: armazenar o valor, mantendo a ordem manual como autoridade. Ordenar por valor é uma ação explícita para não mudar a fila inesperadamente; itens sem valor ficam ao fim, preservando sua ordem relativa.
É permitido adicionar o mesmo token mais de uma vez. Cada participação possui ID próprio, mesmo quando token_id é igual. Edição, remoção, arraste e turno ativo referenciam ID da participação, nunca somente ID do token.
Adicionar sem token: botão Novo participante, campos Nome e Iniciativa opcional. Clicar em uma entrada existente abre sua edição, inclusive nome e valor. Alterar o nome de uma participação não renomeia o token nem a ficha automaticamente.
Arrastar entradas reordena a fila. Manter alternativa de mover para cima/baixo por teclado e toque. Uma alça de arraste separa reordenar de clicar para editar.
Entradas com token exibem miniatura; sem token exibem ícone. Mostrar nome, valor quando houver e condições permitidas. Distinguir participações repetidas sem alterar nome original (ex.: posição/identificador visual).
Preservar turno atual ao reordenar pela identidade da participação. Próximo turno, contador de rodada, visibilidade e opção Pular tokens mortos continuam funcionando. Se a participação ativa for removida, escolher próximo participante de forma previsível sem avançar rodada duas vezes.
A regra de reposição de movimento em participações repetidas deve ser tratada como ponto de revisão antes de codificar: não introduzir silenciosamente benefício ou restrição de regras. Separar visualmente turnos e controle de orçamento de movimento.
Não remover participações independentes por não terem token. Remover token segue a política existente de desvincular entradas e preservar seus dados.

## 4. Janela flutuante da iniciativa

Ao concluir/adicionar a iniciativa, exibir fila, rodada e turno atual em janela no canto inferior esquerdo do mapa.
Mestre e jogadores podem arrastar, minimizar e fechar a própria janela. Posição, tamanho/estado de minimização e fechamento são preferências locais por usuário e mesa; não sincronizar fechamento para todos.
Fechar somente esconde a janela; não encerra combate nem apaga fila. O menu Iniciativa oferece Reabrir janela e Restaurar posição.
Minimizada: mostrar rodada e participante atual em faixa compacta. Ao redimensionar a tela, manter janela dentro da área visível. Não capturar cliques do mapa fora dos limites da janela.
Conteúdo da fila e turno é compartilhado e atualizado automaticamente; jogadores não recebem entradas ocultas nem nomes ou condições secretas. Somente mestres alteram fila/rodada, conforme permissões atuais. Minimizar não interrompe sincronização.

## 5. Estrutura de implementação proposta

- web/workspace.js: retirar atalhos migrados da barra direita e montar a navegação superior; manter o ciclo de vida do mapa.
- web/combat.js: substituir formulários/controles dispersos por ações dos módulos, mantendo seleção única e gravações versionadas.
- web/combat/toolbar.mjs (novo): abas superiores e ciclo de abrir/recolher, acessibilidade e animações.
- web/combat/conditions-panel.mjs (novo): grade de cards, busca, detalhes e alternância por token selecionado; reutilizar condition-icons.mjs.
- web/combat/initiative-panel.mjs (novo): inclusão, edição, participantes repetidos e reordenação.
- web/combat/initiative-window.mjs (novo): janela flutuante e preferências locais.
- combat.py: validar iniciativa opcional, identidades independentes, permissões e compatibilidade com dados existentes.
- combat_history.py: garantir desfazer/refazer das alternâncias e da fila, sem inserir preferências visuais no histórico compartilhado.
- server.py: registrar novos módulos estáticos e atualizar versão de carregamento quando a implementação existir.
- tests/: regressões de servidor e navegador usando fixtures sintéticas, sem depender dos arquivos da campanha.

Não persistir estado de hover, painel aberto, posição de janela ou token selecionado no JSON compartilhado do combate. Reutilizar API/transações/versionamento existentes. Se necessária migração, definir e testar antes de alterar esquema; nenhuma migração foi aplicada nesta preparação.

## 6. Checkpoints e critérios de aceite

### UI-1 — Barra e separação de menus
Entregar abas superiores Combate, Grid, Tokens, Condições, Iniciativa e Dados; hover/foco e toque; remover atalhos duplicados da direita. Abrir/recolher não perde câmera, ferramentas, token selecionado nem estado de combate.

### UI-2 — Cards de condições
5 colunas no desktop, adaptação estreita, busca, cor/ícone/resumo, expansão acessível, aplicação/remoção instantânea, alvo explícito e sem token residual. Testar troca de seleção durante gravação, conflito, estágio, segredo, desfazer/refazer e atualização mestre/jogador.

### UI-3 — Modelo e edição da iniciativa
Valores opcionais, inclusão ao fim, entradas sem token, duplicatas independentes, editar nome, arraste com alternativa acessível e ordem persistente. Testar dados antigos, remoção da entrada ativa, pular mortos e ciclo de rodada. Resolver explicitamente a interação com orçamento de movimento antes de modificar esse comportamento.

### UI-4 — Janela e entrega
Janela inferior esquerda, arrastar, minimizar, fechar, reabrir e restaurar posição. Testar duas contas: fechar no jogador não fecha no mestre; entradas ocultas nunca vazam; atualização funciona minimizada; janela continua recuperável no celular.
Executar regressão de enquadramento/zoom, mudança de horário, tokens, névoa e histórico. Atualizar plano, instruções e pacote leve para instalações existentes, preservando data/ e campaign/.

## Retomada
Ler este documento e PLANO_V15.md. Começar pelo UI-1 somente quando o usuário pedir a implementação. Não retomar CP4 desenhos antes desta prioridade nova. Esta entrega é planejamento, não uma atualização executável do sistema.

## Revisão de UX e direção visual — revisão 2, 03/11/2026

Esta seção refina as decisões anteriores e prevalece quando houver divergência. Continua sendo planejamento: não aplicar alterações executáveis nesta rodada.

### Direção visual
Preservar identidade soft-gótica/vapor de maneira discreta: superfícies em carvão, bordas bronze, títulos claros, ícones vetoriais consistentes. Evitar textura de pergaminho atrás de campos, excesso de ornamentos, dourado em todos os controles ou sombras pesadas. Texto de interface em fonte sem serifa; identidade decorativa somente em títulos curtos.
Definir variáveis únicas para cores, espaçamentos (4/8/12/16/24), raio (8–12), alturas e camadas. Fonte base 14–16 px, controles tocáveis de 44 px como meta do projeto. Verificar contraste de texto normal 4,5:1 e componentes 3:1; cores das condições não determinam automaticamente a cor do texto: usar fundo escuro com faixa/ícone colorido e estado aplicado com contorno/check.
Hierarquia consistente: título → contexto/alvo → ação principal → controles secundários. Estados desenhados explicitamente: normal, hover, foco, ativo, aplicado, desabilitado, gravando e erro. Vermelho reservado a morto/remoção/erro, não decoração geral.

### Geometria estável e abas
Uma faixa superior compacta reservada para navegação; extensão da aba e painel devem sobrepor, nunca alterar altura disponível do mapa em hover. Abas com ícone e rótulo curto visível no desktop; estado ativo persistente. Animação sugerida 120–180 ms, sem elasticidade exagerada; desligar com reduced-motion. O usuário não deve precisar esperar animação para clicar.
Painel ancorado abaixo da aba, largura adequada ao conteúdo: Grid pequeno, Tokens médio, Condições amplo. Apenas um painel de ferramenta aberto; janela da iniciativa é independente. A área externa continua permitindo selecionar token no mapa enquanto Condições está aberto. Clicar no mapa não deve recolher automaticamente esse painel. Esc fecha primeiro detalhes, depois painel; não encerra combate.
Câmera mantém a área estável definida pelo enquadramento aprovado. Abrir menus não muda escala nem posição; painéis podem cobrir temporariamente parte do mapa e são recolhíveis. Ver mapa inteiro continua a ação explícita para enquadrar.
Camadas documentadas: mapa → elementos de cena sujeitos à névoa → interfaces flutuantes → painéis → detalhes/diálogos. Controles de interface não devem herdar transformação/zoom do SVG. Hover nunca revela dados ocultos pelo servidor.

### Responsividade por espaço disponível
- Desktop amplo: seis abas, rótulos curtos, condições em cinco colunas, janela da iniciativa com largura aproximada de 300–360 px e lista com altura limitada.
- Notebook: preservar cinco colunas quando couberem cards de pelo menos cerca de 150 px. Reduzir largura de margens antes de reduzir texto. Não usar painel lateral estreito para esses cards.
- Tablet: condições em duas ou três colunas conforme largura real; painéis com limite na viewport, controles para toque e sem exigir hover.
- Celular: abas em faixa horizontal rolável com indicação de continuidade, painel tipo folha inferior recolhível, condições em uma ou duas colunas. Não esconder funcionalidades em ícones sem nome acessível. Iniciativa inicia minimizada; nunca ocupar toda a tela automaticamente.
Usar largura do recipiente, não somente modelo do dispositivo. Tratar orientação, teclado virtual, zoom do navegador a 200%, safe areas e altura dinâmica. No celular, detalhes são abertos pelo botão Informações, separado de aplicar/remover.

### Condições: aplicação segura e leitura
Cabeçalho fixo com miniatura/nome do token, busca e filtros Todas/Aplicadas. Cards de altura inicial consistente, resumo editorial do efeito sem alterar a regra completa. Expansão visual discreta, detalhes em área sobreposta ancorada ou dentro do espaço reservado do painel, sempre limitada à viewport. Não deixar a expansão deslocar a posição de clique dos vizinhos.
A referência anterior a nunca ocultar o card seguinte deve ser entendida como manter sua posição estável e sua ação recuperável; um detalhe longo pode sobrepor conteúdo temporariamente. Fechar por Esc ou controle explícito, permitir mover o ponteiro sobre detalhes e mantê-los enquanto estiverem sendo lidos. Foco de teclado oferece o mesmo conteúdo.
Aplicar/remove é ação explícita, com indicação Gravando e resultado; falha restaura estado confirmado. Identificar a operação por token_id e condition_id; mudança de seleção não redireciona pedido em andamento. Atualização recebida não rouba foco, não limpa busca nem recria toda a grade. Ordem fixa durante interação.
Permitir Desfazer no feedback da última alteração, ligado ao histórico autorizado. Estágio/segredo têm controles separados e não acionam alternância por propagação do clique.

### Grid e Tokens
Grid com preview e controle deslizante + campo numérico + botões de incremento. Separar tamanho visual do hexágono de metros por hexágono; unidades claras. Não gravar dezenas de revisões durante arraste: prévia local e commit ao soltar/confirmar. Mostrar efeito sobre posições antes da confirmação; preservar coordenadas lógicas e regras existentes nesta etapa, sem prometer recalibragem automática.
Tokens com biblioteca pesquisável e ações visuais. Selecionado permanece explícito; inserir token não pode ser confundido com selecionar para condição/iniciativa. Indicação Inserindo token e Esc para cancelar. Não permitir simultaneamente desenho/posicionamento/medição; preservação das ferramentas atuais é requisito.

### Iniciativa: editar e acompanhar
Menu superior prepara/edita; janela inferior acompanha. Cada linha mostra miniatura, nome, valor opcional, condições essenciais e destaque de turno atual. Ação principal Próximo turno para mestre; demais ações em menu contextual. Jogador recebe apenas leitura autorizada e controles locais da janela.
Inclusão rápida: selecionar token → Adicionar à fila, com valor opcional; incluir novamente gera participação independente. Novo participante não exige token. Valor ausente usa null, nunca zero disfarçado; zero continua válido. Editar valor não reordena por conta própria. Ordenação explícita e estável, sem valor ao fim.
Fila permite drag por alça, marcador claro da posição final, rolagem durante arraste e alternativa Mover acima/abaixo. Conflito concorrente cancela a reordenação local com feedback e mantém estado confirmado, sem sobrescrever alterações de outro mestre.
Para entradas duplicadas, separar identidade da participação da identidade do token/ficha. Decisão de movimento: preservar comportamento atual durante esta refatoração e não criar nova regra silenciosamente; documentar no teste a reposição existente ao iniciar cada participação. Uma opção de reposição por rodada seria mudança de regra futura, não requisito visual.
Janela reduzida mostra rodada + nome atual; expandida mostra também próximo participante. Fechar é preferência local persistente: atualizações ou rodada nova não reabrem à força. Oferecer Reabrir e Restaurar posição. Arrastar somente pelo cabeçalho e limitar às bordas; controles internos não movem janela. Estado local separado por usuário/mesa. Não anunciar nomes ocultos por aria-live.

### Implementação e qualidade
Começar UI-1 com estrutura estática navegável sobre a câmera existente, conferir layouts em 1366×768, 1920×1080, 768×1024 e 390×844 e só então ligar ações. Não fazer redesign monolítico.
Controlador único de menu/seleção, módulos separados para apresentação, ações e preferências. Reutilizar um único observador/poll de estado em vez de cada painel criar timer. Atualizações incrementais preservam foco, scroll, arraste e campos em edição. Não inserir nova dependência pesada só para animações ou drag.
Testes de aceite adicionais: 200% zoom do navegador; teclado sem interceptar digitação; toque sem hover; zero e null na iniciativa; duplicatas; 100 participantes; grade de 28+ condições; duas sessões concorrentes; janela fechada permanece fechada; retomada após desconexão; troca de horário com painel aberto; tokens secretos não aparecem em detalhes nem sugestões.
Critério de entrega: UI aprovada visualmente em capturas de teste, interações verificadas em navegador, permissões no servidor testadas, nenhuma regressão de enquadramento/zoom. Não declarar conformidade WCAG completa sem auditoria.

### Referências e aplicação
As medidas, cores e interações específicas acima são propostas para o Atlas, não resultados de teste com nossos jogadores.
- Roll20, Toolbar Overview: agrupamento de ferramentas e acesso direto a dados. https://wiki.roll20.net/Toolbox_Overview
- Foundry, Combat Encounters: tracker dedicado, edição de participantes e visibilidade. https://foundryvtt.com/article/combat/
- Owlbear Rodeo, Assets: biblioteca acessível por dock; manter mapa como centro da tarefa. https://docs.owlbear.rodeo/docs/managing-assets/
- NN/g, Progressive Disclosure: mostrar controles principais primeiro e detalhes sob demanda. https://www.nngroup.com/articles/progressive-disclosure/
- W3C, Content on Hover or Focus: detalhes dispensáveis, alcançáveis pelo ponteiro e persistentes enquanto usados. https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html
- W3C, Target Size: referência de alvos de 44 px; usada aqui como meta de toque, sem alegar certificação. https://www.w3.org/WAI/WCAG21/Understanding/target-size
