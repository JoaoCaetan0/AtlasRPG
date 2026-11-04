# Atlas V16 CP3 — tokens recentes e mapa anterior

## Escopo

A substituição das oito artes antigas foi cancelada por solicitação do usuário. As oito imagens originais são preservadas. A coleção recebe vinte novas artes no mesmo estilo colorido/cartoon, totalizando 28 modelos. Não usar as imagens realistas produzidas no rascunho cancelado nesta distribuição.

Novos modelos: guarda, cavaleiro, maga, sacerdote, mercadora, engenheira, camponês, esqueleto, zumbi, orc, cultista, autômato, aranha gigante, javali, corvo, rato gigante, cobra, morcego, armadilha rúnica e barril explosivo.

## Tokens recentes

Abra Tokens → Meus recentes. São guardados os últimos 30 tokens personalizados criados pelo mestre naquela mesa, em ordem do mais novo ao mais antigo. A lista é persistida no servidor e sobrevive à atualização da página e ao reinício. Cada mestre tem sua lista; jogadores não podem consultá-la.

Entram na lista os novos tokens feitos no formulário Adicionar token e os modelos inseridos pela biblioteca com nome, movimento ou visibilidade personalizados. Reutilizar um recente também registra a nova criação. Inserir um modelo básico sem mudanças não ocupa essa lista. Os básicos usados recentemente continuam numa opção separada.

O modelo guarda nome, aparência, cor, movimento disponível e visibilidade. Uma cópia começa sem ficha, controlador, efeitos, estado de morte, posição anterior ou movimento gasto. Isso evita reutilizar por engano o estado de outro encontro. A lista começa a ser preenchida após esta atualização; versões anteriores não registravam esse histórico de criação.

## Mapa anterior

O botão ← na barra horizontal volta ao último mapa efetivamente apresentado aos jogadores. Seu título informa o destino. A ação é exclusiva de mestres, sincroniza a cena e preserva o estado já salvo do destino. Não se confunde com desfazer combate nem com o botão Mesas.

O histórico é por mesa e persiste no servidor. Mostra um destino anterior, não uma lista completa de navegação. Ao retornar entre dois mapas, eles alternam. Retirar uma cena permite recuperá-la pelo botão; nesse caso, após restaurar, o botão fica indisponível até existir outro destino. Trocar apenas o horário não consome esse histórico. Prévia de mapa não muda o mapa anterior. Se outro mestre trocar a cena, ações com revisão antiga são recusadas.

## Instalação e retomada

Encerre o servidor, faça backup de data/ e mescle atlas-local na instalação existente, substituindo os arquivos do programa. Preserve campaign/, dados e documentos pessoais. Reinicie e pressione Ctrl+F5. Banco atualizado para esquema 14, com tabelas adicionais recent_tokens e previous_scene. Para voltar à versão anterior, restaure programa e backup correspondentes.

Módulos novos: recent_tokens.py e scene_history.py. Os dois são instalados por assets.py. A gravação de recentes ocorre na mesma transação que salva o novo token; falhas e conflitos não acrescentam entradas. A consulta é protegida por papel de mestre e limitada por mesa e autor.

As artes novas são geradas individualmente, com fundo transparente. O conjunto de assuntos está em TOKENS_NOVOS_V16.json. Prompt comum: “New individual VTT token asset: [subject]. Match a colorful cartoon fantasy token collection: bold dark outlines, clean cel shading, compact chibi proportions for humanoids, playful readable silhouette, saturated colors, full subject visible centered with safe padding. One subject only, no background scenery, no text, no border, transparent background. Square game icon, not realistic or painterly. All appendages and equipment fully inside canvas.”

Nenhuma regra de ficha, condição ou cálculo de névoa foi alterada neste lote.

## Validação concluída

- Servidor: 54 testes executados, 52 passaram e 2 ignorados; nenhum erro. Inclui permissões, limite e isolamento dos recentes, conflitos de revisão, retorno à cena e preservação do horário ao alternar mapas.
- Modelos de tokens: 3 testes JavaScript passaram.
- Navegador Chromium: catálogo de 28 imagens decodificado; busca, categorias, favoritos, inserção em lote, desfazer, posicionamento por clique, Escape, arrastar, ocultação para jogadores, persistência, edição de aparência e layout móvel passaram.
- Navegador: criação e reutilização de personalizados, persistência após recarregar e retorno ao último mapa passaram.
- 28 PNGs íntegros com transparência. Os oito originais são idênticos byte a byte à distribuição anterior. Hashes em TOKENS_V16_VERIFICACAO.json.
- Testes realizados em ambiente Linux/Chromium com mapas sintéticos; Windows, Opera e Radmin não foram executados neste ambiente.

Reprodução do pacote: python package_update.py CAMINHO_DO_ZIP. O pacote contém código, documentação, testes e as 28 artes; mapas e dados da campanha permanecem na instalação existente.
