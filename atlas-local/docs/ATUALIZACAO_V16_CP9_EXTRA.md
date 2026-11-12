# CP9 — régua, NPCs e retratos personalizados

## Régua
Botão circular flutuante no canto inferior direito, junto ao mapa. Amarelo/dourado quando ativo. Clique para alternar; a medição não consome movimento. Nome acessível e estado pressionado para leitores de tela. Desenhar, voltar ao ponteiro ou posicionar um token encerra a medição.

## Documentos → Personagens · NPCs
Cadastro privado por mesa, acessível somente aos mestres. Lista alfabética em português, busca por nome ou descrição, cards com miniatura, nome e descrição breve. Para cadastrar durante a mesa, basta preencher o nome; descrição, detalhes e token são opcionais. Abrir o card permite editar as notas, associar uma aparência existente ou criar um retrato sem fechar o editor. Alterações simultâneas são detectadas pelo servidor para evitar sobrescrever notas de outro mestre. Exclusão exige confirmação. Nenhum NPC de exemplo é criado automaticamente.

## Tokens → Criar token
Aceita PNG, JPEG e WebP estáticos, até 10 MiB / 32 megapixels. O recorte circular e o redimensionamento são feitos no navegador: prévia, enquadramento para preencher ou exibir toda a imagem, zoom, deslocamento horizontal/vertical e borda com cor e espessura configuráveis. O resultado é um PNG de 512 × 512 com transparência externa. Não há remoção automática do fundo interno da imagem nem geração por IA nesse fluxo.
O retrato fica salvo na mesa, disponível no catálogo, nos 30 personalizados recentes e no seletor de NPCs. Pode ser inserido como qualquer token, com movimento, condições e iniciativa. O arquivo de origem não é enviado; somente o PNG final. Os retratos privados não são expostos aos jogadores pela lista do catálogo; a imagem é servida quando existe um token correspondente visível na cena compartilhada. Imagens já vistas/baixadas não podem ser revogadas do computador do jogador.

## Instalação e continuidade
Feche o servidor, copie data/ como backup e mescle atlas-local na instalação existente. Preserve data/ e campaign/. Reinicie e pressione Ctrl+F5. Novas tabelas SQLite são criadas automaticamente, sem apagar dados anteriores. O backup integral de data/ inclui notas dos NPCs e retratos.

## Validação
Resultado final: 74 testes Python aprovados, 2 pulados; 11 testes Node aprovados. Sintaxe de todos os módulos JavaScript verificada.
Teste HTTP cobre permissões de mestre/jogador, isolamento entre mesas, persistência, conflito de edição, cadastro de retrato, recentes, associação ao NPC, inserção no combate e bloqueio da imagem quando ocultada. Testes de geometria, régua, agrupamento e inserção em lote continuam na suíte Node. Não houve teste visual interativo em navegador neste ambiente; validar o fluxo de recorte e o posicionamento do botão no navegador usado na mesa.
