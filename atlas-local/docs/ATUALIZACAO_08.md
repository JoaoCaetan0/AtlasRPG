# Atlas V08 — biblioteca de tokens

Extraia os três ZIPs comuns na mesma pasta, mesclando `atlas-local`. Antes de
atualizar, feche o servidor e faça backup de `data/`. Os pacotes não incluem
esse diretório. Reinicie e recarregue o navegador; se necessário, use Ctrl+F5.
O esquema do banco continua na versão 5, sem migração adicional.

## Como usar

Na cena compartilhada, o mestre abre **Assets ▾**. Escolha uma miniatura,
informe a quantidade e use **Posicionar no mapa** para clicar no local desejado,
ou **Inserir agora** para usar uma posição livre próxima da área visível.
No computador, também é possível arrastar a miniatura ao mapa.

Cada inserção permite 1 a 20 cópias, respeitando o limite de 200 tokens por mapa
e o limite existente de tamanho do estado. As cópias recebem números e células
livres. A inserção ativa o combate. Os valores de movimento são genéricos, não
estatísticas oficiais de criaturas do livro; ajuste-os conforme a ficha.

Os oito modelos são bandido com espada, bandido arqueiro, goblin, slime, lobo,
urso, NPC aliado e armadilha. São desenhos coloridos com transparência,
gerados para este projeto. Não são imagens copiadas do Roll20.

Armadilhas começam com **Oculto para jogadores** marcado e movimento zero.
O mestre pode alterar isso antes de inserir ou no editor do token. A arte
genérica é pública; os dados de posicionamento de tokens ocultos não são
enviados aos jogadores. Elas são marcadores manuais, sem gatilho ou dano automático.

## Organização e controles

- Busca por nome, categoria e palavras-chave, sem exigir acentos.
- Categorias, favoritos e modelos usados recentemente.
- Favoritos/recentes ficam neste navegador, separados por usuário e mesa;
  não são sincronizados entre computadores.
- Nome e movimento em uma seção recolhível, com miniatura e rótulo do modelo.
- Esc ou Cancelar interrompem o posicionamento sem criar tokens.
- Desfazer remove a última inserção enquanto a revisão da cena não mudou.
  O botão fica indisponível após outra alteração, evitando desfazer trabalho
  concorrente. Esse histórico não é mantido depois de recarregar a página.
- Tokens anteriores continuam funcionando. No editor, Aparência permite
  escolher um desenho ou retornar ao círculo com iniciais.
- No celular, o seletor vira um painel dentro da tela, com rolagem própria.

## Arquivos

`web/tokens/catalog.json` descreve o catálogo; `web/tokens/*.png` contém as oito
artes originais. `web/combat/asset-library.mjs` controla o menu, e
`web/combat/token-model.mjs` cria os lotes e filtra os modelos.
`token_assets.py` define os arquivos públicos e IDs permitidos no servidor.
As referências de UX e sugestões futuras estão em `PESQUISA_UX_V08.md`.
Os prompts completos estão em `PROMPTS_TOKENS_V08.md`.

O acervo anterior de 509 itens foi preservado. As oito novas artes fazem parte
dos arquivos do sistema e são incluídas nos ZIPs junto com esse acervo.
