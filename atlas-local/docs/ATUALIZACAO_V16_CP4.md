# Atlas V16 CP4 — criaturas, segurança e integridade

## Entrega concluída

A coleção contém 36 tokens. Foram acrescentados golem de pedra, golem de ferro, ent, wyvern, ogro, troll, grifo e elemental de fogo, na categoria Monstros. Os 28 anteriores foram preservados byte a byte. Os novos modelos usam os mesmos fluxos de inserção, posição, movimento, condições, iniciativa e recentes; não trazem fichas ou estatísticas de monstro automáticas. Movimento inicial de 10 é editável e não representa uma regra oficial dessas criaturas.

Correções de segurança e limitações estão em SEGURANCA_V16_CP4.md. Incluem autorização na organização de arquivos, verificação de novos uploads, JSON/HTTP mais estritos e rotação de sessão ao entrar novamente. Banco continua no esquema 14. audit_data.py e VERIFICAR_INTEGRIDADE.bat conferem banco e blobs sem alterar dados.

## Instalação

Este é um pacote cumulativo do programa e dos 36 tokens para sua instalação existente. Não contém novamente os mapas, PDFs ou dados pessoais da campanha. Feche o servidor, faça backup de data/ e mescle atlas-local na instalação, substituindo arquivos do programa. Preserve data/ e campaign/. Reinicie e use Ctrl+F5. Para conferir a integridade, encerre o servidor e execute VERIFICAR_INTEGRIDADE.bat. O resultado aparece no terminal; não há reparo automático.

## Validação

- Python: 60 testes executados, 58 passaram, 2 ignorados, nenhum erro. Inclui seis novos testes de segurança/integridade, mais regressões de permissões, combate, névoa, perfis, dados, cenas e recentes.
- JavaScript: três testes do modelo de tokens passaram.
- As 36 imagens foram conferidas como PNG com canal alfa; o teste HTTP do catálogo percorre todas as rotas de imagem.
- Comparação binária confirmou preservação dos 28 tokens anteriores.
- Testes de navegador desta entrega não executados: o Chromium local não estava disponível e seu download falhou. Os roteiros permanecem no pacote, atualizados para 36 itens. Nenhuma mudança visual de menus foi feita neste lote.
- O banco real da campanha não foi auditado; somente bases temporárias de teste. Sem teste Windows/Opera/Radmin nesta execução.

## Checkpoint e próximas etapas

Este lote encerra as oito criaturas e a primeira revisão limitada de segurança. Não torna o Atlas apto a hospedagem pública. O checklist de preparação online permanece pendente.

PROXIMA_ETAPA_VISAO_E_DADOS.md documenta opções de visão circular/cone por token, paredes/luz em fase posterior, comandos no chat com referência Rollem V1, animações por dado, fórmulas e melhorias de UI/UX. Nada disso foi ativado nesta versão. Arrombamento e furtividade ficam expressamente fora do Atlas por enquanto.

Reproduzir pacote: python package_update.py CAMINHO_DO_ZIP. Preservar testes, relatório, catálogo e prompts nas próximas entregas.
