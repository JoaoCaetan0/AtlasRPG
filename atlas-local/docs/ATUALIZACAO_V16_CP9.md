# Atlas V16 CP9 — famílias e variações de tokens

## Escopo
38 famílias, três artes diferentes por família: 114 opções. Os 36 tipos existentes foram preservados e ganharam novas artes. Hobgoblins e xamãs goblins são duas famílias novas. A primeira versão mantém o identificador antigo: cenas, fichas vinculadas, favoritos e personalizados recentes continuam válidos. A arte de tokens antigos muda para a nova direção visual, mas seus dados não mudam.

## Catálogo rápido
- Subgrupos: Bandidos, Goblinoides, Pessoas e aliados, Animais, Construtos, Mortos-vivos, Criaturas e Armadilhas e objetos.
- Famílias em trios de cards sobrepostos. Mouse ou foco do teclado abre o trio dentro do espaço da família. O card em foco/selecionado recebe contorno branco luminoso.
- Em dispositivos de toque e com movimento reduzido, as opções ficam abertas.
- Busca sem acentos inclui família, variação e subgrupo. Favoritos e recentes mostram somente as versões correspondentes ao filtro.
- Clicar seleciona; Posicionar no mapa, Inserir agora e arrastar continuam disponíveis. Quantidade, nome, movimento e ocultação preservados.
- Formulário de edição agrupa aparências por família.
- Ilustrações transparentes com lado maior até 768 px para a cena; miniaturas até 192 px carregadas sob demanda no catálogo. Proporções preservadas.

## Goblinoides
Goblin: Clava (careca, arma improvisada), Escudeiro (adaga e broquel), Arqueira (arco).
Hobgoblin: Brutamontes (machado), Couraçado (armadura, escudo e maça), Besteiro.
Xamã goblin: Cajado (cristal e capa), Sombrio (foice ritual e magia violeta), Totêmico (penas e totem).

## Ferramentas adicionais
Régua circular flutuante, cadastro privado de NPCs em Documentos e gerador de retratos com recorte circular. Consulte ATUALIZACAO_V16_CP9_EXTRA.md para o fluxo completo.

## Instalação
Feche o servidor. Faça backup de data/. Mescle atlas-local na instalação existente, substituindo arquivos do programa e preservando data/ e campaign/. Reinicie e use Ctrl+F5. As novas tabelas de NPCs e retratos são criadas automaticamente, preservando os dados existentes.
Pacote cumulativo do programa, artes e documentação; não inclui mapas e documentos particulares da campanha.

## Retomada e rastreabilidade
Manifesto: docs/token-art/manifest.json. Contém descrição, prompt, fonte e estado de cada uma das 114 artes. Cada geração concluída possui um registro em docs/token-art/completed/. build_token_catalog.py confere transparência, produz os tamanhos de uso e publica o catálogo apenas quando todas as imagens estão presentes. Geração realizada com a ferramenta de imagens integrada. Redimensionamento técnico com Pillow, sem redesenhar ou recolorir as artes.
Próxima demanda de programação: gradiente de visão e Explorer mode continuam pendentes; não foram alterados nesta atualização.

## Validação
Suíte Python: 76 testes, 74 aprovados e 2 pulados por ausência do PDF real de referência da ficha. Nenhuma falha.
114 imagens e 114 miniaturas integradas, com transparência e hashes distintos verificados. Revisão visual das artes concluída. Testes de agrupamento, filtros, inserção em lote, geometria e régua: 11 aprovados. O teste HTTP decodifica todos os PNGs, além de verificar o catálogo, IDs legados e aparências nas cenas. As interfaces novas ainda precisam de validação visual no navegador da mesa; não houve navegador executável disponível neste ambiente.
