# Atlas V16 CP16

## Instalação
Feche o servidor e faça backup. Mescle atlas-local substituindo arquivos do programa; preserve data/ e campaign/. Reinicie e use Ctrl+F5 em todos os navegadores. Atualização cumulativa, inclui CP14/CP15 e os 114 tokens; mapas/documentos particulares ficam na instalação existente.

## Mudanças
- Direção do token indicada por uma pequena seta dourada, acompanhando a rotação local e remota. Norte continua o padrão; direções salvas preservadas.
- Arraste do mapa também com botão direito. Clique direito sem arrastar abre ações do token. Rodinha mantém zoom e botão do meio mantém pan.
- PV/PD do token controlado: edição dos valores atuais e preferências individuais de barra, visibilidade e números. Mestre mantém administração. Máximos e tokens de outros jogadores continuam protegidos no endpoint.
- Mensagem de Salvar token aponta para Personagens → Tokens salvos.
- Combate auditado e mantido por conter funções necessárias; relatório incluído.

## Testes
98 testes Python: 96 passaram e 2 foram pulados por PDFs privados ausentes. 42 testes JavaScript passaram. Sintaxe JS/MJS validada. Integridade completa do ZIP verificada pelo empacotador.
Chromium não iniciou (socket Operation not permitted). Testes automatizados não substituem a conferência visual de mouse, camadas e responsividade. Não foi medida a latência na rede do usuário.

## Continuidade
Checkpoint: docs/reestruturacao/CHECKPOINT.md. Plano: docs/reestruturacao/PLANO.md.
Próximo: memória visual isolada por token. Depois, desempenho e fichas amplas. A auditoria visual geral permanece pendente.
