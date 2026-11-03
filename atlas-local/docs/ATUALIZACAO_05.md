# Versão 05 — mapa principal e criação de personagem

## Instalação completa
Baixe os três arquivos Atlas_Estigma_V05_Parte_1.zip, Parte_2.zip e Parte_3.zip.
São ZIPs normais, independentes. Extraia os três na MESMA pasta, mesclando a pasta
atlas-local. Não renomeie as extensões, não concatene e não use montador.
A parte 1 inclui o programa; as três juntas incluem todo o acervo anterior.

Para instalação nova: Python 3.10+, INSTALAR_SUPORTE_PDF.bat e
INICIAR_WINDOWS.bat ou INICIAR_REDE_RADMIN.bat. Cadastre a conta e prepare a mesa
Estigma com o código de anfitrião apresentado no terminal.
Para atualizar: feche o servidor, faça backup da pasta data e extraia sobre a
instalação anterior. O pacote não inclui nem substitui data. A migração adiciona
configuração de cálculo às fichas existentes. Não volte a executar V04 nesse banco
após a migração; para voltar, use o backup anterior.

## Mapa e combate
A aba separada de combate foi substituída por Mapa e combate.
O botão Combate abre/recolhe o painel; o mapa ganha a largura disponível quando
fechado. Em telas pequenas o painel fica abaixo, sem cobrir a imagem.
O mestre ativa o combate por mapa. Grid, tokens, terreno, iniciativa, condições,
cores, custos e limites de movimento usam o estado compartilhado persistido.
O modo exploração esconde a camada de combate sem apagar a configuração.
Rodada e turno ativo aparecem na barra compacta. Zoom e Ajustar são locais.
O mapa segue atualizado por consulta a cada três segundos, como na V04.

Acessos aparecem na cena do mestre. Clicar muda a cena de todos, sem abrir o
catálogo. Acessos com múltiplos destinos abrem uma escolha. O horário é preservado
quando disponível; caso contrário, é usada uma versão existente e aparece aviso.
A API valida mestre, acesso de origem, destino e revisão para impedir mudanças
concorrentes incorretas. Os jogadores não recebem os metadados de acessos secretos.
Enviar uma cena disponibiliza a imagem inteira aos participantes; névoa continua
pendente. Combates são conservados por imagem: trocar a variação de horário abre
outro estado; retornar à mesma imagem recupera o anterior. Tokens não viajam
automaticamente com o grupo.

## Fichas
Seções recolhíveis: Identidade; Atributos e recursos; Perícias; Poderes e magias;
Inventário; Descrição e anotações. Busca encontra campos e abre sua seção.
Barra Salvar ficha / Salvar e abrir PDF permanece presa à borda inferior ao rolar.
Modelos genéricos continuam editáveis; o assistente só aparece em modelos com
campos compatíveis com a ficha Estigma. Não há conversão automática de outros RPGs.

Fonte: ebook Canva DAHX3QrgRoo, consultado em 23/10/2026, pp. 13–50.
- Nove raças e doze classes selecionáveis.
- PV = 1 + bônus racial + classe + CON×4 + max(FOR,0) + max(DES,0).
- PD = 1 + bônus racial + classe + CON×2 + (max(CAR,0)+max(INT,0))×3.
- Defesa natural = 10 + DES×2 + bônus racial e de classe.
- Defesa total acrescenta os campos armadura, escudo e modificador.
- PP iniciais, metade de PD como sanidade máxima, capacidade de inventário,
  slots de magia pela regra geral e negação de dano sem equipamento são exibidos.
- Bônus fixos das raças e Musculatura Saudável, Voto Sagrado ativo e Aura mística
  são considerados; as três habilidades de classe têm seleção explícita.
- Perícias iniciais de classe e bônus raciais fixos podem ser aplicados por botão;
  escolhas raciais de Elfo, Anão e Tritão têm menu. Mantém níveis já superiores.
- PV atual, PD atual e PP gastos/adquiridos nunca são sobrescritos pelo cálculo.
  O botão de recursos iniciais preenche apenas campos vazios.
- Automação opcional e persistida na ficha; cálculos autoritativos no servidor.
  Ajustes manuais têm campos próprios e fórmulas ficam visíveis.

Limites das regras: distribuição de atributos na Lótus de cada classe continua
manual, pois a extração de texto não preservou os rótulos das posições e as
miniaturas não puderam ser obtidas. Não foi inventada uma correspondência.
Aluno Exemplar do Mago e regra geral de slots exigem decisão de acumulação;
a interface sinaliza e oferece ajuste. Distribuição livre de NP (ex.: Golem,
Elfo), habilidade racial herdada do Golem, poderes condicionais/temporários,
progressão, equipamentos e cálculos de autômatos não foram automatizados.
Recursos extras exibidos no resumo não têm campos próprios no PDF original.

## Revisão geral
Formulários, foco de teclado, espaçamento, contraste, navegação responsiva,
painéis, organização de arquivos em formulário e caderno com barra fixa.
Enviar um mapa agora abre a cena compartilhada. Prévias continuam privadas.

## Verificação
10 testes Python: permissões, conflitos, movimento, ocultação de tokens/efeitos,
navegação de cena, persistência, fórmulas com negativos, habilidades, PDF real
editável e migração idempotente. JavaScript validado com node --check.
Acervo conferido contra hashes do manifesto e integridade dos ZIPs.
Não foi possível executar navegador gráfico: o Chromium não estava instalado e
seu download retornou conteúdo inválido. A UI ainda precisa de validação visual
no PC do usuário, assim como conexão efetiva de dois PCs pelo Radmin.

## Referência de interface
Roll20 Help Center, Turn Tracker:
https://help.roll20.net/hc/en-us/articles/360039178634-Turn-Tracker
Usada como referência de controles junto ao mapa e ordem de turnos editável.
Nenhuma dependência do serviço Roll20 foi adicionada.
