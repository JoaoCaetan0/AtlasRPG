# Retomada V11

Versão com interface lateral concluída e validada. Ler ATUALIZACAO_11.md e VALIDACAO_V11.md. Entregar os três ZIPs completos; GitHub pausado. Banco continua no esquema 6. Preservar campaign/ e data/.

Arquitetura: web/workspace.js controla a mesa persistente, barra de ícones e painel sobreposto. #pane contém só o mapa. #workspace-content é o editor lateral compartilhado; chat/dados/combate/assets/histórico possuem slots próprios. currentPane permanece scene dentro da mesa; currentPanel identifica o painel aberto. mapPoll é independente de poll dos editores. Abrir/fechar painel não chama combatView, exceto mudanças reais de cena.

chatView monta um componente com seletores locais e timer próprio; mountDice é reutilizado no slot de dados. Ambos preservam campos na alternância e encerram timers quando removidos. Os demais editores usam #workspace-content. Recolher preserva o rascunho; trocar de seção pede confirmação se dirty. Impedir interação enquanto a leitura inicial carrega é necessário para não apagar texto digitado cedo demais.

combatView move seus controles para os slots depois de criar a imagem; ao mudar de cena substitui somente seus próprios controles. Não apagar o drawer inteiro durante uma troca de mapa. O callback onClose da biblioteca recolhe o painel ao posicionar/inserir tokens. Atalhos de histórico continuam limitados ao mapa; digitação nos painéis não desfaz combate.

Testes de navegador usam porta 8766: executar em série. ATLAS_BROWSER aponta para Chromium; Playwright é dependência de desenvolvimento, não de execução do usuário. ATLAS_UI_OUTPUT define evidências temporárias. tests/ui_fixture.py precisa dos assets da campanha. ui_workspace.cjs cobre a nova estrutura. Demais quatro suítes foram adaptadas e passaram.

Pendências gerais: REQUISITOS_PENDENTES.md. Não reimplementar recursos prontos. Scripts de empacotamento não devem incluir data/, dependências de desenvolvimento ou screenshots.
