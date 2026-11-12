# Atlas V16 CP8 — menu rápido dos tokens e barras

## Uso
Clique com o botão direito no token. No celular, mantenha pressionado por aproximadamente meio segundo, sem arrastar. Pelo teclado, foque um token e use Shift+F10. Esc ou toque fora fecha o menu.

O menu usa cards compactos e submenus no mesmo popover, reposicionado para caber na tela:
- Iniciativa: valor opcional, entrada no fim e múltiplas entradas permitidas.
- Marcar morto / Reviver: mantém ficha, recursos e condições; usa o X vermelho existente.
- PV e PD: atuais, máximos, exibição das barras e privacidade. Preencha atual e máximo para exibir.
- Visão: alcance, amplitude e direção. Campos vazios de alcance/amplitude herdam a cena. Jogadores são encaminhados ao controle de direção existente.
- Vincular jogador: controle independente da propriedade da ficha; inclui Somente mestres.
- Editar token: abre o editor completo existente.
- Excluir: confirmação curta, remove o token e suas iniciativas, preserva a ficha. Pode desfazer no histórico de combate.

## Barras e permissões
PV usa rosa/vermelho e PD usa azul, abaixo do nome do token. Valores numéricos são opcionais. A proporção é limitada visualmente entre 0 e 100%, preservando o valor real (por exemplo, PV negativo).
Cada barra pode ser visível para Todos, Mestres e responsável, ou Somente mestres. Quando valores numéricos estão desligados, a resposta pública de renderização traz apenas a proporção.
Jogadores só podem modificar os recursos atuais permitidos de tokens que controlam. Máximos e configurações são dos mestres. Uma barra marcada Somente mestres não é exposta pelo endpoint de recursos do controlador.

Quando há ficha vinculada, os campos canônicos pv_atual, pv_maximo, pd_atual e pd_maximo são a fonte dos valores. Salvar atualiza a mesma ficha com controle de versão. Isso não autoriza abrir os demais campos da ficha de outra pessoa. Sistemas com campos de nomes diferentes ainda precisam de mapeamento próprio.
Sem ficha, os recursos ficam em um registro separado por mesa, mapa e token. Ao excluir/restaurar um token, seus recursos persistem. O histórico de combate desfaz preferências das barras, controle, morte e exclusão; não reverte os valores de PV/PD nem alterações feitas na ficha. Máximos calculados automaticamente pela ficha podem ser recalculados em futuras edições dela.

Tokens antigos continuam herdando o controle da ficha até receberem controle independente. Editar o controle pelo menu ou salvar o editor de token passa a usar a atribuição explícita.

## Correção adicional
O módulo dice-visuals.js, introduzido anteriormente, não estava na lista de arquivos servidos. A rota foi corrigida, junto à inclusão de token-menu.mjs. Um novo teste HTTP verifica os módulos usados pelo carregador e pelo combate para evitar regressão na abertura do Atlas.

## Instalação
Feche o servidor. Faça backup de data/. Mescle atlas-local na instalação existente, substituindo os arquivos de programa e preservando data/ e campaign/. Reinicie e use Ctrl+F5. A tabela token_resources é criada automaticamente, sem apagar dados; schema14 mantido.
Pacote cumulativo com 36 tokens. Mapas e documentos particulares dependem da instalação existente.

## Validação
- Python: 75 testes, 73 aprovados e 2 ignorados.
- Node: 12 testes aprovados.
- Sintaxe dos arquivos JS/MJS verificada.
- Novos testes cobrem valores ligados à ficha, controle delegado sem acesso à ficha, privacidade, alterações concorrentes, validação, exclusão/restauração, disponibilidade dos módulos HTTP, limites do popover e desenho das barras.
- Validação visual e interação real em navegador ainda pendentes: o download do navegador de testes falhou com arquivo truncado. Não foi testado em Opera/Windows nem em celular real.

## Checkpoint da próxima leva
Este lote conclui o menu e as barras. Permanecem pendentes:
1. Gradiente de visão: faixa acinzentada além da visão direta, só com a imagem de fundo, respeitando a cobertura manual.
2. Distância e intensidade do gradiente por cena e substituição por token, integradas ao submenu Visão.
3. Explorer Mode opcional: memória das áreas exploradas por jogador, sem tokens nem objetos atuais fora da visão direta. Separar memória de periferia.
4. Paredes, portas, fontes de luz e prévia completa com tokens.
5. Validação visual em navegador e testes de desempenho com mapas reais.
Arrombamento e furtividade continuam fora do Atlas.
