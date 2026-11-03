# Atlas — versão 06

## Instalação
Baixe os três ZIPs Atlas_Estigma_V06_Parte_1.zip, Parte_2.zip e Parte_3.zip.
Extraia todos na mesma pasta, mesclando atlas-local. Cada arquivo é um ZIP
comum: não renomeie, não concatene e não use montador.
A entrega inclui o acervo completo da V05, sem novos mapas gerados.

Se já usa o sistema, feche o servidor e faça backup de data/ antes de extrair.
O pacote não contém data/. O banco migra automaticamente para a versão 5 do
esquema. Não execute versões antigas contra esse banco depois da atualização.
Para voltar, restaure o backup anterior.
Instalação nova: Python 3.10+, INSTALAR_SUPORTE_PDF.bat, INICIAR_WINDOWS.bat ou
INICIAR_REDE_RADMIN.bat. Prepare Estigma com o código exibido no terminal.
O uso continua local/LAN/Radmin; nenhuma hospedagem ou integração GitHub.

## Dados e histórico
A aba Dados e o botão Dados sobre o mapa abrem o mesmo componente.
Atalhos d4/d6/d8/d10/d12/d20/d100, vantagem (2d20kh1), desvantagem (2d20kl1),
expressão livre, descrição opcional e visibilidade Mesa / Mestres e autor /
Somente autor. A regra de vantagem do sistema pode exigir outra expressão;
o botão deixa explícito o atalho utilizado, sem assumir uma regra universal.
Histórico persistido, consulta ao vivo a cada 3 segundos, páginas anteriores,
resultados destacados e detalhes expansíveis com dados considerados,
descartados e na faixa crítica. Mestre pode limpar o histórico compartilhado;
rolagens pessoais permanecem privadas, inclusive para outros mestres.
Dados não são inseridos como mensagens de texto na aba Conversa: possuem seu
próprio histórico, disponível também sem sair do mapa.

Sorteio exclusivamente no servidor com secrets, parser sem eval, limite de
complexidade e idempotência de reenvio. Comparações e erros de sintaxe têm
respostas legíveis. Animação CSS 3D curta só na tela de quem rolou, opcional e
respeitando redução de movimento. É uma animação visual de cubo, não uma
simulação física dos diferentes poliedros nem a fonte do sorteio.

### Sintaxe implementada
- XdY e dY; operações +, -, *, /; parênteses e números negativos.
- ! e !N; ns; k/kh/kl; d/dl/dh; cN.
- Ajustes por dado ++ e --; contagem << e >>; comparação final < <= > >= =.
- X#expressão; dF; BX/GX/WX e explosão; aro/daro/taro.
- Prefixos opcionais /roll, /r e &.

Base: documentação oficial Rollem V1:
https://rollem.rocks/docs/v1-syntax
https://rollem.rocks/docs/v1-syntax/dice-math
https://rollem.rocks/docs/v1-syntax/exploding-dice
Compatibilidade parcial, não paridade completa com o bot. Macros/comandos de
Discord, comentários anexados à expressão e múltiplas rolagens inline entre
colchetes não são interpretados. Precedência das operações pode diferir em
combinações ambíguas; use parênteses. Os testes não comparam cada expressão
contra uma instalação do Rollem original.
Limites desta implementação: 300 caracteres, 100 dados por grupo, faces de
2 a 100.000, 20 repetições, 1.000 sorteios incluindo explosões, 20 níveis de
parênteses e resultados até magnitude 10^12. Explosão ao atingir 1 é recusada.
Exceder limites ou dividir por zero não registra resultados parciais.

## Administração
Nova aba apenas para mestres, com:
- Nome, sinopse e sistema da mesa.
- Padrão de grid: raio, distância, unidade e exibição.
- Catálogo de condições: busca, inclusão, ícone, cor, descrição e estágios.
- Cadastro e edição de mapas: nome, região, notas, disponibilidade e até 20
  versões nomeadas, cada uma ligada a uma imagem da Biblioteca.
- Upload de imagem durante o cadastro, prévia e salvamento explícito.

Padrões de grid/condições aplicam-se a imagens sem combate salvo. Combates
existentes são preservados. Mudar o nome do sistema não converte fórmulas,
PDFs ou personagens de Estigma em regras de outro RPG. Um editor completo de
regras configuráveis ainda está pendente.

Compartilhar um mapa no catálogo libera suas imagens. Ocultar o catálogo não
revoga imagens previamente liberadas; essa gestão continua na Biblioteca.
Uploads permanecem limitados a 10 MiB. Salvar mapa não exclui imagens antigas.

## Editor visual de acessos
Mapas → Prévia → Editar acessos. Clique em Desenhar acesso e arraste sobre a
imagem; dê nome e selecione destinos. Arraste áreas existentes para reposicionar;
medidas em porcentagem continuam disponíveis para ajustes precisos.
Ao fechar, alterações não salvas exigem decisão. Salvar verifica se outro mestre
modificou os acessos, evitando sobrescrever silenciosamente o trabalho dele.
Os jogadores continuam sem permissão de editar ou conduzir a cena compartilhada.

A cena agora guarda a identidade do mapa selecionado, para diferenciar dois
mapas que reutilizam a mesma imagem. Em cenas antigas ambíguas, selecione o mapa
novamente pela aba Mapas. O combate continua por imagem: reutilizar a mesma
imagem em dois cadastros também compartilha seu estado de combate.

## UI e UX
Ferramentas agrupadas, formulários com ações fixas, busca em listas,
prévia das imagens, mensagens de validação, nomes claros de visibilidade,
controle de alterações não salvas e erros de concorrência sem perda silenciosa.
Revisão visual de dados, editor de acessos, combate e administração. Layouts de
390 px e 1440 px testados sem transbordamento horizontal das páginas verificadas.

## Verificação e retomada
19 testes Python aprovados, incluindo PDF real, permissões, persistência,
parser de dados, históricos privados, idempotência, configuração por mesa,
cadastro de mapas, revisão concorrente e identidade da cena com imagens repetidas.
JavaScript validado sintaticamente.
Teste automatizado em navegador Chromium 153: login, abertura de mesa,
ativação de combate, rolagem, administração, criação de mapa, edição visual
de acessos, cálculo/salvamento da ficha e layout móvel.

Para repetir: python -m unittest discover -s tests -v (configure ATLAS_TEST_PDF
com o PDF real para não pular o teste de exportação). O script tests/ui_smoke.cjs
usa Playwright instalado no ambiente de desenvolvimento; ATLAS_BROWSER pode
apontar para um Chromium. ATLAS_UI_OUTPUT escolhe uma pasta temporária para
as capturas. O navegador e pacotes Node de teste não são dependências do Atlas
em produção nem estão incluídos nesta distribuição. Use porta 8766 livre.

Checkpoint intermediário: Atlas_V06_Checkpoint_01.zip. A entrega completa V06
é o estado final; não substitua seus arquivos pelo checkpoint intermediário.
Pendências futuras em REQUISITOS_PENDENTES.md. Conexão real entre PCs por Radmin
continua dependendo de teste no ambiente do usuário; não foi simulada como concluída.
