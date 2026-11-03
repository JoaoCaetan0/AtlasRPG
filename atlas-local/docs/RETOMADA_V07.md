# Retomada — V07

Pedido: corrigir dificuldade de adicionar tokens, melhorar UI/UX, organização
do código e desempenho com referências online.

Implementado: botão de criação direto no mapa; ativação explícita de combate
ao salvar um novo token; posicionamento livre próximo do viewport; formulário
com erros locais e proteção contra duplo envio; separação das telas do cliente;
módulos de geometria e renderer; camadas SVG persistentes; pausa de polling em
aba oculta; documentação de arquitetura e testes de regressão.

Diagnóstico: V06 cria tokens em combate ativo, mas não os exibe em exploração.
Não declarar que foi reproduzida uma impossibilidade universal de adicionar.

Preservar: acervo completo, rede local/Radmin, esquema de banco 5, dados locais,
GitHub pausado e entrega em três ZIPs comuns. Não adicionar dependência de build
para o usuário. `package_release.py` valida hashes do acervo e os arquivos ZIP.

Validação final e detalhes constam em `VALIDACAO_V07.md`. A lista histórica de
requisitos permanece em `REQUISITOS_PENDENTES.md`; esta atualização não pretende
concluir fog of war, integrações externas ou outras funcionalidades fora do escopo.
