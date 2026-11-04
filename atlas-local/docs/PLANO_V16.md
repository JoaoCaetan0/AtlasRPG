# Atlas — projeto da próxima versão

Data: 03/11/2026. Base: V15 CP4b. Estado: planejamento; nenhuma alteração executável nesta etapa.

## Objetivo e limites

Transformar o Atlas em uma mesa virtual independente de sistema, preservando Estigma do Caos como opção inicial. Corrigir a administração, simplificar ações da cena e oferecer preparação visual dos mapas. A visão por tokens, iluminação e paredes ficam somente no roteiro futuro. Manter operação local/LAN/Radmin, dados, campanha, mapas, acessos existentes e enquadramento já validado.

## 1. Interface da mesa

- Retirar da lateral os painéis Mapa (seta) e Desfazer/refazer. Levar suas ações à barra horizontal: voltar à interação com o mapa, desfazer e refazer. Preservar atalhos, permissões e indicação da ação que será desfeita. Histórico detalhado fica como ação secundária, não como painel obrigatório.
- Reposicionar controles úteis do painel Mapa junto à cena; Retirar cena continua separado, com rótulo explícito, evitando confusão com recolher um painel ou voltar às mesas.
- Preservar etiquetas de ferramentas e cards coloridos. Hover apenas destaca/explica; clique abre. Teclado e toque devem oferecer o mesmo acesso. Não deslocar outros controles quando uma etiqueta expande.
- Administração: abrir área ampla de preparação com navegação compacta por Mesa, Sistema e Mapas. Uma seção de cada vez, resumo inicial e opções avançadas recolhidas. Retorno à cena preserva câmera, seleção e painel de iniciativa.
- Diagnóstico estático: web/style.css define .admin-layout com duas colunas, primeira com mínimo de 280px; o breakpoint de 800px depende da janela, não da largura do drawer. Isso pode comprimir a segunda coluna mesmo em desktop. Corrigir layout por largura do contêiner, min-width:0, controles fluidos e empilhamento. Confirmar em execução antes de declarar causa exclusiva.
- Evitar correções globais de quebra de palavras. Nomes longos quebram em espaços; URLs podem quebrar. Formulários e botões não devem criar rolagem horizontal.

## 2. Criação e configuração de mesas

Fluxo: escolher sistema em cards → informar nome e sinopse opcional → revisar e criar. Usar padrões funcionais; Personalizar abre configurações adicionais, sem exigir preenchimento de todos os parâmetros.

Cada mesa guarda uma versão própria de seu perfil. Editar condições ou fórmulas da mesa A não modifica a mesa B. Atualização de um preset mostra diferenças e só entra em mesas existentes por ação do mestre. Trocar o sistema de uma mesa preenchida exige prévia de mapeamento e cópia de segurança; nunca apagar fichas silenciosamente.

| Opção | Base planejada | Limite/validação |
|---|---|---|
| Estigma do Caos | Catálogo e regras já presentes no projeto | Conferir fórmulas e lótus no livro; manter valores manuais e habilidades personalizadas |
| Ordem Paranormal | Livro básico, revisão explicitamente identificada | Catálogo público confirma o produto, não todas as fórmulas; validar regras na fonte antes de ativar automações |
| Tormenta20 | Edição Jogo do Ano | Não misturar com edição anterior; usar material oficial e registrar versão/fonte |
| D&D | Escolha explícita entre regras 2014/SRD 5.1 e 2024/SRD 5.2.1 | Implementar conteúdo do SRD escolhido com atribuição; não apresentar como acervo completo dos livros |
| Personalizado | Começar vazio ou copiar um perfil | Editor visual, prévia da ficha, importar/exportar perfil e restaurar padrões |

Cards mostram edição e cobertura: estrutura de ficha, condições e automações verificadas. Não rotular um perfil como completo quando existem apenas campos ou regras parciais. Não inferir autorização de redistribuição de textos integrais a partir de uma página pública de produto.

### O que o mestre configura

- Identidade, unidades, atributos, recursos (vida, energia etc.) e grupos da ficha.
- Condições: nome, ícone, cor, descrição, estágios/duração opcionais. Separar marcador visual de efeito automatizado; aplicação não implica desconto automático sem regra definida.
- Criação de personagem: escolhas de origem/raça/classe conforme o sistema, progressão, habilidades concedidas e pré-requisitos. Sistemas sem classes não exibem esse campo.
- Valores derivados: fórmulas com variáveis e operações permitidas, prévia com personagem de exemplo e erro legível. Dependências cíclicas ou campos inexistentes bloqueiam publicação da regra.
- Valores manuais continuam possíveis, identificados como ajustes do mestre/jogador autorizado; recalcular não apaga a substituição manual.
- Modelo de PDF opcional com mapeamento de campos. PDF anexado não equivale automaticamente a uma ficha calculada.
- Regras de iniciativa e movimento configuráveis onde já houver suporte; recursos ainda indisponíveis aparecem como pendentes, sem controles fictícios.

### Separação técnica proposta

Núcleo: contas, mesas, permissões, arquivos, cenas, tokens, chat e sincronização. Perfil de regras: esquema de ficha, catálogos, cálculos, condições e concessões de habilidades. Apresentação: componentes reutilizáveis que recebem o esquema, sem nomes de atributos fixos no motor.

Perfil versionado com id, edição, versão de esquema, fontes, cobertura, campos, condições, regras e modelos. Mesa referencia uma cópia versionada com alterações locais. IDs estáveis impedem que renomear uma condição quebre tokens. Habilidades automáticas registram origem, distinguindo-as das inseridas manualmente. Não executar JavaScript/Python arbitrário em fórmulas importadas. Validar tamanho e formato no servidor, com permissões de mestre e controle de revisão.

Introduzir gradualmente adaptadores para Estigma; não reescrever combate, armazenamento e fichas simultaneamente. Preservar leitura de registros antigos e exportação PDF atual durante migração.

## 3. Preparação dos mapas

Área própria: Preparar mapas. Fluxo curto: escolher/enviar imagem → organizar mapa → posicionar acessos → prévia e salvar. Separar salvar rascunho de apresentar aos jogadores.

- Importação individual ou em lote, miniaturas, progresso e erros por arquivo; biblioteca pesquisável com filtros regional/encontro e tags. Duplicatas sugerem reutilização, sem mesclar à força imagens distintas.
- Card por mapa: nome, categoria, miniatura, horários disponíveis e quantidade de acessos. Campos avançados fechados inicialmente.
- Horários agrupados no mesmo mapa. Reutilizar posições de tokens/acessos só quando as variantes forem alinhadas e isso for confirmado; dimensões proporcionais não garantem alinhamento visual.
- Editor central com imagem inteira, zoom e pan; painel curto para o acesso selecionado. Arrastar marcador ou desenhar área retangular/elíptica, redimensionar, escolher nome e destino em cards pesquisáveis. Forma poligonal pode entrar depois.
- Não exigir coordenadas numéricas; oferecer ajuste fino por teclado como alternativa ao arraste. Coordenadas normalizadas mantêm localização com mudança de tamanho da tela.
- Vincular mapas importados e existentes livremente, inclusive múltiplas saídas para o mesmo destino. Destino pode ter ponto de chegada opcional.
- Acesso de ida e volta é opção explícita; a volta também precisa de posição escolhida no destino. Não criar portais simétricos em posições inventadas.
- Nome visível, área clicável e visibilidade para jogadores são propriedades distintas. Prévia de jogador evidencia o que será revelado. Links para mapas privados não concedem acesso por acidente; conferir permissão no servidor.
- Editor não modifica nenhum acesso antigo até o mestre escolher editá-lo e salvar. Adaptador de leitura compatível com os registros existentes. Detectar destino ausente e avisar antes de apagar um mapa utilizado por links.
- Na sessão, clique do mestre segue a política explícita de apresentar a cena; exploração de destino no editor não muda a tela dos jogadores. Não criar deslocamento automático de personagens entre cenas nesta etapa.

Dados separados: imagem/arquivo; mapa lógico e variantes; cena e estado de combate; acesso entre mapas. Não embutir navegação nos pixels nem duplicar imagens para criar links.

## 4. Névoa e visão — somente roteiro futuro

Nenhum código, padrão ou estado da névoa atual será modificado nesta versão.

Etapa futura A: visão circular por token, alcance padrão da mesa/cena e substituição individual. Distância usa escala do mapa, não pixels da tela. Cada jogador recebe a união das áreas dos tokens que controla; sem token atribuído, visão vazia com mensagem útil e aviso ao mestre. Compartilhar visão do grupo é escolha explícita, desligada por padrão. Névoa desativada mostra o mapa inteiro, preservando permissões de tokens e documentos secretos.

O mestre possui visão administrativa e ferramenta Ver como jogador. Desabilitar visão em um token difere de raio zero. Decidir explicitamente se tokens mortos mantêm visão; padrão proposto: manter até o mestre alterar para não modificar encontros existentes inesperadamente.

Separar cobertura manual, visão atual e memória de exploração. Padrão futuro conservador: sem memória fora do alcance. Revelação manual pública é ação explícita. Regras de precedência precisam de exemplos visuais antes de implementar.

Etapa futura B: direção do token, cone ajustável (proposta inicial de 160°), luzes, paredes, portas e bloqueios. Visão e emissão de luz são propriedades diferentes: um token pode enxergar sem iluminar; uma tocha pode iluminar sem possuir visão. Parede que bloqueia luz não necessariamente bloqueia movimento. Interseção de alcance, cone, obstáculos e iluminação determina a visão final.

O servidor atual entrega imagens mascaradas. Evolução exige isolamento por jogador: cache e respostas devem considerar mesa, cena, revisão, permissões e visão. Não enviar a imagem original, tokens secretos ou coordenadas de entidades invisíveis e apenas cobri-los no navegador. Validar troca de dono e reconexão. Evitar compartilhar cache entre usuários com visões diferentes.

Preparar cálculo geométrico incremental e índice espacial de paredes; medir desempenho antes de escolher implementação final. O modelo de máscara 128×128 atual não deve ser assumido suficiente para contornos detalhados. Movimento deve atualizar a visão automaticamente; suavização local não pode revelar conteúdo antes de autorização.

## 5. Checkpoints e critérios de conclusão

| Lote | Entrega | Verificação principal |
|---|---|---|
| CP1 | Ações horizontais e administração responsiva | Sem perda de ações; sem texto comprimido; teclado/toque; câmera preservada |
| CP2 | Perfis versionados e adaptação do Estigma | Migração preserva fichas e ajustes; isolamento entre mesas; regressão de cálculos e PDF |
| CP3 | Assistente de mesa, editor e presets | Edições explícitas; regras verificadas; condições e habilidades sem duplicação; fórmulas inválidas rejeitadas |
| CP4 | Biblioteca de mapas e importação em etapas | Uploads parciais recuperáveis; salvar não publica; filtros, horários e permissões |
| CP5 | Editor de acessos | Links antigos intactos; edição por arraste/teclado; destino privado protegido; sincronização de cena |
| CP6 | Revisão integrada e pacote de atualização | Dois clientes, atualizações automáticas, regressão de grid/tokens/iniciativa/desenhos e backup/migração |
| Futuro | Visão, cone e luz | Pesquisa registrada; sem implementação no ciclo atual |

Em cada lote: registrar arquivos alterados, testes executados, pendências, versão e instruções de retomada; entregar atualização ao usuário. Preservar campanha/data. Executar regressões apropriadas sem declarar testes no Windows ou Radmin se não houver execução real nesses ambientes.

Validação de interface prevista: 1366×768 e 1920×1080, tablet e 390px; zoom de navegador a 200%; nomes longos; teclado; cores acompanhadas de ícone e texto; redução de animações. Cinco cards por linha apenas onde couberem, reduzindo colunas em painéis estreitos. Botões de salvar/cancelar acessíveis sem cobrir campos. Mensagem junto ao erro com forma de correção, não apenas Dados inválidos.

Os princípios foram confrontados com referências; ainda não existe validação de usabilidade da implementação desta versão. Essa validação será feita nos checkpoints.

Pendências anteriores preservadas: desenhos por jogadores dependem de propriedade/permissões; revisão visual da lótus e compactação final das fichas entram na adaptação do Estigma; melhorias amplas de dados permanecem posteriores. Não considerar esses itens concluídos por este plano.

## 6. Referências consultadas

- Foundry — separação de mundos, sistemas e módulos: https://foundryvtt.com/article/tutorial/
- Foundry — desenvolvimento de sistemas: https://foundryvtt.com/article/system-development/
- D&D — versões e conteúdo dos SRDs: https://www.dndbeyond.com/srd
- D&D — limites entre SRD e outros conteúdos: https://www.dndbeyond.com/creator-faq
- Jambô — Tormenta20 Jogo do Ano: https://jamboeditora.com.br/produto/tormenta20-edicao-jogo-do-ano/
- Jambô — Ordem Paranormal: https://jamboeditora.com.br/produto/ordem-paranormal-rpg-/
- Roll20 — visão dos jogadores: https://help.roll20.net/hc/en-us/articles/11786989363479-Using-Dynamic-Lighting-As-A-Player
- Roll20 — ferramentas e diagnóstico de iluminação: https://blog.roll20.net/posts/jumpgate-update-lighting-updates/
- NN/g — divulgação progressiva de opções: https://www.nngroup.com/articles/progressive-disclosure/
- W3C — conteúdo em hover/foco: https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus.html

Decisões de UX e arquitetura acima são propostas para o Atlas, não afirmações de que todas as plataformas citadas usam os mesmos fluxos. Catálogos de livros não substituem leitura das regras completas.

## Entrega intermediária V16 CP3 — tokens e retorno de mapa

A pedido do usuário, o lote entregue com o rótulo V16 CP3 prioriza 20 novos tokens, histórico dos últimos 30 personalizados e retorno à cena anterior. O refazimento das oito artes existentes foi cancelado. O CP3 previsto na tabela de planejamento (assistente/editor/presets) não deve ser considerado concluído por causa deste número de versão; seus itens seguem pendentes de implementação ou verificação. Estado detalhado desta entrega: ATUALIZACAO_V16_CP3.md.
