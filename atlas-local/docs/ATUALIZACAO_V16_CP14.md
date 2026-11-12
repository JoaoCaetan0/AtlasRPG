# Atlas V16 CP14 — estabilização e roteiro estrutural

## Instalação
Feche o servidor. Faça backup da instalação, especialmente data/ e campaign/. Mescle a pasta atlas-local deste ZIP na instalação existente, substituindo arquivos do programa. Preserve data/ e campaign/. Reinicie e use Ctrl+F5 nos navegadores. Este pacote contém o programa cumulativo e 114 tokens; os mapas e documentos particulares continuam na instalação existente.

## Mudanças
- Retratos: corrigida rejeição HTTP 413 acima de 64 KiB. Limite específico compatível com o gerador, mantendo validação PNG e permissões. Feedback de processamento e erros úteis; retrato anterior preservado se a gravação falhar.
- Dados: formulário com rolagem própria e botão Rolar separado, resultados no início, sem campo opcional de descrição. Favoritos, fórmulas e resultados mantidos.
- Avisos: faixa fixa substituída por toasts; erros de ações permanecem até serem dispensados.
- Fichas: salvar retorna à lista de personagens; falhas mantêm os campos. Exportação PDF preservada.
- Jogadores: Mapas e Névoa removidos dos painéis e acessos administrativos bloqueados; a cena e a névoa automática permanecem.
- Layout: ajustes iniciais de altura, rolagem e diálogos. Auditoria visual completa ainda pendente.

## Validação
Python: 97 testes executados — 95 passaram e 2 foram pulados por ausência de PDFs privados. JavaScript: 33 testes passaram. Sintaxe de todos os scripts JS/MJS validada. ZIP verificado integralmente pelo empacotador.

Não foi possível iniciar o Chromium neste ambiente (socket: Operation not permitted). A validação visual em dispositivos e zoom real permanece pendente. Não há alegação de melhora de latência: a investigação de desempenho terá medições próprias. Upload confirmado em HTTP; a mensagem específica de fetch no navegador do usuário não foi reproduzida visualmente.

## Continuidade
Plano por dependências: docs/reestruturacao/PLANO.md.
Checkpoint, limitações e próxima ação: docs/reestruturacao/CHECKPOINT.md.
Esta é a primeira leva, não a conclusão das etapas A–F. Próximo lote: estrutura comum de painéis, minimização com preservação, organização individual e integração de tokens salvos. Memória por token e ficha ampla estão planejadas, ainda não implementadas.
