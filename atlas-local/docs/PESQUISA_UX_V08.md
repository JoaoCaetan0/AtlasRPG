# Referências e aplicação de UI/UX — V08

Foram consultadas documentação oficial do Roll20, Nielsen Norman Group,
W3C/WAI e Microsoft Fluent 2. São referências reconhecidas de produto,
usabilidade e acessibilidade. Adotá-las não substitui testes com nossos jogadores
nem significa que o Atlas recebeu certificação de acessibilidade.

| Referência | Padrão | Aplicação nesta versão |
| --- | --- | --- |
| Roll20 — Art Library | Pesquisa e organização de assets; inserção ao arrastar para a mesa | Menu Assets com busca, categorias e drag-and-drop |
| NN/g — Recognition and Recall | Opções reconhecíveis reduzem a necessidade de memorizar comandos | Miniaturas acompanhadas por nomes, categorias e estado selecionado |
| NN/g — Progressive Disclosure | Mostrar primeiro o essencial; revelar opções menos frequentes sob demanda | Menu recolhível e seção Nome e movimento |
| NN/g — User Control and Freedom | Permitir sair de ações e recuperar erros | Cancelar, Esc e desfazer a última inserção |
| W3C/WAI — Dragging Movements | Oferecer alternativa que não exija arrastar | Escolher modelo e clicar no mapa; Inserir agora funciona por teclado |
| W3C/WAI — Target Size | Controles com tamanho e espaçamento adequados | Novas ações principais e favoritos com alvo de pelo menos 44 px de altura |
| Microsoft Fluent — Popover | Conteúdo excedente precisa permanecer acessível | Rolagem no seletor e painel adaptado à tela móvel |

WCAG 2.2 AA especifica alvo mínimo de 24 × 24 CSS px, com exceções; os 44 px
adotados aqui são uma escolha mais confortável para os novos controles, não uma
afirmação de conformidade de todos os elementos existentes no aplicativo.

## Melhorias recomendadas para próximas etapas

1. **Barra Mais para ações secundárias.** Retirar cena, recarregar e ajustes raros
   podem ir para um menu secundário; manter Assets, Dados e Combate visíveis.
   A orientação de overflow do Fluent recomenda preservar rótulos de texto.
2. **Ações contextuais ao selecionar um token.** Exibir editar, duplicar e
   visibilidade perto da seleção, mantendo acesso equivalente no painel.
3. **Busca global de arquivos com filtros persistentes.** Reaproveitar o padrão
   de miniaturas, categoria e resultados vazios claros no acervo completo.
4. **Histórico de desfazer por operação.** Ampliar a recuperação além da última
   inserção exige registrar operações no servidor e resolver concorrência.
5. **Teste curto com o mestre e dois jogadores.** Pedir que localizem um modelo,
   criem três inimigos, escondam uma armadilha e corrijam uma inserção; observar
   erros, cliques desnecessários e clareza dos estados antes de expandir menus.

Os itens desta seção são recomendações, não funcionalidades concluídas na V08.

## Fontes

- Roll20: https://help.roll20.net/hc/en-us/articles/360039675113-Art-Library
- NN/g: https://www.nngroup.com/articles/recognition-and-recall/
- NN/g: https://www.nngroup.com/articles/progressive-disclosure/
- NN/g: https://www.nngroup.com/articles/user-control-and-freedom/
- W3C/WAI: https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
- W3C/WAI: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Fluent: https://fluent2.microsoft.design/components/web/react/core/popover/usage
- Fluent: https://fluent2.microsoft.design/components/web/react/core/toolbar/usage
