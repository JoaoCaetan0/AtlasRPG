# CP19 — ficha ampla e organizada

Pacote cumulativo sobre CP18.1, com 114 tokens. Não altera regras, banco, permissões ou protocolos.

## Interface
- Editor ocupa 94% da largura e altura no desktop; tela inteira no celular.
- Estrutura compartilhada entre Estigma/PDF e sistemas configuráveis, respeitando as seções configuradas pelo mestre.
- Navegação interna por seções, campo de busca e cards. Atributos separados de recursos e defesa em Estigma/PDF. Identidade abre primeiro.
- Busca ignora acentos e encontra campos fora da seção atual; mostra estado sem resultados. Campos ocultos continuam no mesmo formulário e são enviados ao salvar.
- Rolagem própria da seção; cabeçalho e ações fora dela. Ações de salvar e PDF continuam acessíveis sem percorrer o formulário.
- Minimização continua preservando o DOM e rascunho. Ao reabrir, a ficha conserva seção, campos e posição de leitura. Ao trocar para outros menus, eles mantêm o tamanho habitual.
- Retorno à lista após salvar, com foco e destaque no personagem atualizado. Erros preservam a ficha. Voltar continua pedindo confirmação quando há alterações.

## Preservado
Fórmulas, escolhas raciais, perícias, poderes, habilidades automáticas, ajustes manuais e PDF seguem os mesmos fluxos. Não inventados valores da Lótus nem campos adicionais. O modelo genérico continua sem exportação PDF onde ela já não existia. A prévia PDF permanece no diálogo existente.

## Testes
- 44 testes JS passaram.
- 11 testes Python de perfis, regras e vínculo de fichas/tokens passaram; um teste de PDF real foi ignorado por ausência do modelo de teste.
- Sintaxe dos scripts alterados validada.
- Incluído tests/ui_sheet_cp19.cjs: preservação de campos, busca entre seções, navegação e acesso ao rodapé em 1440×900, 700×420, 390×844 e 320×568. A execução foi tentada, mas Chromium não iniciou (socket Operation not permitted). Esse teste visual/DOM está pendente, não aprovado.

## Instalação
Feche o servidor. Faça backup de data/. Mescle atlas-local na instalação, substituindo arquivos do programa e preservando data/ e campaign/. Reinicie e use Ctrl+F5.

## Limites e retomada
A etapa visual foi implementada, mas requer conferência no navegador real. O desempenho de rede E1–E3 segue parcialmente medido conforme CP18. Nenhuma alegação de validação visual ou conclusão de todas as pendências do projeto.
