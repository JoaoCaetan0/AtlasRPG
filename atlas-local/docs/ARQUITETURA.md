# V13 — fichas e habilidades

character_id validado por mesa. Nome/controlador vêm da ficha. Recursos separados do estado, só ao responsável/mestre após filtro de névoa, fora do histórico de combate. Habilidades derivadas sem alterar campos manuais. Catálogo em docs/HABILIDADES.json. ReportLab e fontes locais geram anexo. Esquema 8.

# V12 — névoa

Autoridade no servidor, por mesa e digest da imagem. /api/fog usa revisão otimista; histórico próprio de 20 passos. /api/asset entrega PNG redigido ao jogador. Cache limitado a quatro imagens, geração serializada. Envio com cobertura na mesma transação da publicação. Esquema 7 e Pillow 12.3.0.

# Complemento V11

workspace.js mantém o mapa (#pane) independente dos painéis. currentPanel é a seção lateral; currentPane permanece scene. mapPoll nunca deve ser cancelado por canLeave de um editor. Chat e dados têm slots e timers próprios, finalizados por desconexão do DOM. Os demais editores usam #workspace-content. Nenhuma mudança de banco.

# Complemento V10

Combate: polling de um segundo com exclusão de consultas simultâneas, indicação de reconexão e guarda por geração da tela. GETs usam no-store e timeout; mutações seguem revisões do servidor. Formulários detectam revisão alterada. geometry.mjs fornece rota em linha e estimativa de custo; a autoridade continua no combat.py. Estados JSON usam cloneState em HTTP LAN. Arquivos estáticos também usam no-store.

# Organização do Atlas — V09

O servidor continua Python + SQLite, e o cliente usa JavaScript nativo. Não é
necessário instalar Node, compilar a interface ou usar hospedagem para jogar.

## Onde alterar cada recurso

| Responsabilidade | Arquivos |
| --- | --- |
| Inicialização, autenticação, navegação de abas e estado compartilhado | `web/app.js` |
| Mapas, prévia, envio de cenas e biblioteca pessoal | `web/files.js` |
| Caderno, conversa, participantes e convites | `web/participants.js` |
| Fichas, seções e cálculo solicitado ao servidor | `web/characters.js` |
| Navegação entre mapas em janela | `web/navigation.js` |
| Interface de combate, formulários e sincronização | `web/combat.js` |
| Matemática hexagonal e posicionamento sem DOM | `web/combat/geometry.mjs` |
| Camadas SVG e atualização dos elementos alterados | `web/combat/renderer.mjs` |
| Rolagens e administração | `web/session.js`, `web/admin.js` |
| HTTP, autenticação e inicialização do banco | `server.py` |
| Regras e persistência de cada domínio | `combat.py`, `characters.py`, `rules.py`, `dice.py`, `admin.py`, `assets.py`, `features.py` |
| Conteúdo original e correspondência entre nomes e arquivos | `campaign/manifest.json`, `campaign/blobs/` |
| Dados reais do anfitrião | `data/` — nunca incluído nas entregas |
| Regressões de servidor, matemática e fluxos visuais | `tests/` |

Os módulos `.mjs` têm dependências explícitas e podem ser testados separadamente.
As telas existentes ainda usam as funções compartilhadas de `app.js`; esta é
uma divisão incremental, não uma conversão completa do cliente para ES modules.
`index.html` carrega as telas antes de iniciar o aplicativo. Novos recursos devem
preferir módulos com entradas explícitas e evitar novos estados globais.

## Renderização e desempenho

A imagem, a grade, o terreno e os tokens possuem camadas próprias. A grade é
um único caminho SVG, recalculado somente quando tamanho, visibilidade, modo ou
altura da imagem mudam. Selecionar, editar e mover tokens preserva o nó da imagem
e o caminho da grade. Cada token mantém seu próprio nó, atualizado quando seu
conteúdo muda. A busca de células percorre as linhas que intersectam o mapa,
em vez de um quadrado baseado na maior dimensão da imagem.

O polling do combate pausa quando a aba do navegador fica oculta. A retomada
acontece no próximo intervalo de três segundos; a arquitetura de comunicação
continua a mesma. Não há promessa de ganho percentual ou teste em Radmin real.

Não foi aplicado cache público aos documentos da campanha: eles têm permissões
por participante. Não foram alterados os identificadores dos arquivos nem o
esquema do banco. Mover ou renomear blobs manualmente pode quebrar referências;
use o painel Biblioteca para organizar títulos e pastas.

## Referências consultadas

- MDN, JavaScript modules: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
  — módulos nativos, importação dinâmica e escopo de dependências.
- web.dev, Avoid large, complex layouts and layout thrashing:
  https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing
  — reduzir alterações e quantidade de elementos que exigem trabalho visual.

Aplicação ao Atlas: isolamento da geometria e do renderer, carregamento dos
módulos ao entrar na cena e preservação de elementos estáticos. Separar arquivos
melhora manutenção; por si só não comprova melhoria de velocidade.

## Validação e evolução

Servidor: `python -m unittest discover -s tests -q`.
Defina `ATLAS_TEST_PDF` com o caminho da ficha original para incluir sua exportação.
Geometria: `node --test tests/geometry.test.mjs`.
Navegador: `node tests/ui_smoke.cjs` com Playwright instalado; `ATLAS_BROWSER`
pode apontar para um Chromium local. `ATLAS_UI_OUTPUT` recebe resultados temporários.
Node e Playwright são ferramentas de desenvolvimento, não dependências do jogo.

O teste visual usa banco descartável e verifica criação de token na exploração,
erro recuperável de salvamento, edição, movimento, exclusão, persistência,
interface móvel e preservação das camadas estáticas. Também cobre fichas,
dados, administração e edição dos acessos.

## Biblioteca de tokens (V08)

- `web/tokens/catalog.json`: IDs, nomes, categorias, imagens e padrões iniciais.
- `web/tokens/*.png`: oito imagens originais geradas, com transparência.
- `web/combat/asset-library.mjs`: seletor e preferências por usuário/mesa no navegador.
- `web/combat/token-model.mjs`: filtros e lotes sem efeitos colaterais no estado.
- `token_assets.py`: catálogo autorizado e rotas estáticas explícitas.
- `combat.py`: valida a aparência opcional e filtra posicionamentos ocultos.

A arte genérica é pública; a instância do token é protegida pelo acesso à mesa.
O renderer resolve o ID do modelo pelo catálogo, sem interpretar URLs arbitrárias
fornecidas no estado. A imagem de cada modelo é reutilizada pelos tokens.

Testes adicionais: `node --test tests/token-model.test.mjs` e
`node tests/ui_assets.cjs`. A suíte Python inclui `test_token_assets.py`.

## Histórico de combate (V09)

`combat_history.py` guarda até 40 operações na tabela SQLite `combat_history`.
Os endpoints `combat-undo` e `combat-redo` validam mestre, revisão e estado atual.
O histórico usa a mesma chave mesa/imagem do combate; é persistente e compartilhado.
Não muda o esquema de tokens ou o renderer. Banco no esquema 6.
