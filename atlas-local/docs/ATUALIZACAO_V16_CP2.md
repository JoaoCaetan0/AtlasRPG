# Atlas V16 CP2 — interface e perfis por mesa

Entrega de 03/11/2026. Base: V15 CP4b. Banco: esquema 13.

## Instalação

1. Encerre o servidor do Atlas.
2. Faça uma cópia da pasta data/ antes da primeira inicialização desta versão.
3. Extraia o ZIP e mescle atlas-local com a pasta atlas-local existente, substituindo os arquivos do programa.
4. Preserve data/, campaign/, imagens, fontes e PDFs existentes. O pacote leve não os inclui nem os apaga.
5. Inicie normalmente e use Ctrl+F5 no navegador. Não há nova dependência nesta atualização.

O banco recebe uma tabela adicional de perfis e passa ao esquema 13. Nenhum registro de mapa, ficha ou acesso existente é convertido ou apagado. Uma versão antiga do servidor rejeitará esse esquema; para voltar, restaure programa e backup anteriores juntos.

## Implementado

- Botão direto para voltar à interação com o mapa; desfazer/refazer na barra horizontal, com disponibilidade e descrição da ação. Histórico detalhado continua acessível pelo painel Combate.
- Administração ampla, dividida em Mesa, Sistema e Mapas; layout de acordo com a largura disponível. No celular, o painel deixa a barra superior acessível.
- Cards de mapas com miniaturas, busca sem distinção de acentos, filtros regional/encontro e botão Acessos. Salvar um cadastro retorna à preparação de mapas. A busca de destinos facilita o editor de áreas retangulares existente.
- Escolha de perfil na criação de mesa: Estigma, Ordem Paranormal, Tormenta20 Jogo do Ano, D&D 2014, D&D 2024 e Personalizado.
- Perfil independente por mesa, versionado e protegido contra sobrescrita concorrente. Edição reservada a mestres. Mesas antigas preservam o adaptador existente.
- Editor visual de campos de texto, texto longo e números; agrupamento em seções, busca e fórmulas numéricas. Importação/exportação JSON de perfis genéricos. Importar altera apenas o rascunho até salvar e validar.
- Fichas genéricas sem exigir PDF, atribuídas a participantes. Cálculos ao salvar, dependências entre campos e substituição manual de resultados. Cada ficha mantém uma cópia do perfil da sua criação, evitando mudanças retroativas.
- Fichas genéricas podem ser vinculadas a tokens, usando o vínculo de nome, propriedade e abertura já existente; o resumo não mostra recursos específicos do Estigma para essas fichas.
- Condições editáveis na seção Sistema e salvas por mesa para novos combates. Perfis genéricos começam sem as condições do Estigma.
- PDFs de mesas com perfis genéricos não recebem automaticamente regras/habilidades do Estigma, mesmo que tenham nomes de campos semelhantes.

## Uso rápido

Crie uma mesa Personalizado. Abra Administração → Sistema. Adicione os campos numéricos vigor e vida, usando vigor * 2 + 10 como fórmula de vida. Salve o sistema. Em Personagens, crie uma ficha escolhendo Ficha configurável do Atlas. Preencha vigor e salve: vida será calculada. Marque Ajuste manual para substituir o resultado.

Campos usam identificadores estáveis; nomes e seções podem mudar sem alterar o identificador. Fórmulas aceitam +, -, *, /, min, max, floor, ceil, round e abs. Campos numéricos vazios valem zero. Referências inexistentes, ciclos e execução de código são rejeitados. Divisão por zero impede o salvamento e mostra o campo a revisar.

## Limites desta entrega

- Presets externos são estruturas iniciais configuráveis, com campos básicos de identidade e recursos. Não incluem catálogos completos, condições oficiais, progressão, habilidades automáticas ou fórmulas verificadas dos livros. A interface informa essa cobertura.
- O Estigma mantém assistente, campos e PDF atuais. Seu editor de regras ainda não foi migrado para o mecanismo genérico; a conferência da lótus continua pendente.
- Trocar o sistema de uma mesa existente é bloqueado até haver migração com prévia. Crie outra mesa para usar outro perfil.
- Alterar o perfil afeta novas fichas. Não existe nesta entrega atualização em lote dos esquemas das fichas existentes.
- Exportar perfil JSON inclui campos e fórmulas; não inclui condições, grid, personagens, mapas, PDFs nem arquivos. A portabilidade completa virá na próxima etapa.
- Fichas genéricas não têm exportação PDF automática. É possível criar separadamente uma ficha baseada em PDF preenchível existente; ainda não há mapeamento entre os dois formatos.
- O editor de acessos continua retangular; não foi implementado nesta leva o assistente completo de importação, formas elípticas, link bidirecional ou prévia de jogador.
- A névoa, suas máscaras, cálculos e regras de visibilidade não foram alterados. Visão por token, cone, paredes e luz continuam somente planejados.

## Verificação

- Suíte Python: 50 testes, 48 passaram e 2 ignorados por dependerem de material completo da campanha/PDF ausente neste ambiente.
- Novos testes: fórmulas, ciclos, operações proibidas, ajuste manual, isolamento de condições, permissões de ficha/perfil, conflitos de revisão e preservação do esquema de fichas existentes.
- Navegador Chromium automatizado: criação de mesa personalizada, editor de campos, exportar/importar perfil, salvar condições, criar ficha, cálculo, ajuste manual, administração em 1366×768 e 390×844, acesso ao editor de mapas.
- Regressões no navegador: enquadramento/zoom, filtros de mapas, cards de condições, iniciativa duplicada/sem token, troca de horário com dois clientes, desenhos e sincronização.
- Comparação com V15 CP4b: fog.py, web/combat/fog.mjs, scene_variants.py e web/navigation.json permaneceram idênticos.
- Não foi executado teste em Windows real ou via Radmin.

## Retomada

Primeiro abrir PLANO_V16.md e este documento. Novos módulos: system_profiles.py e web/system-profiles.js. Eles concentram os perfis, cálculos e interface configurável. A ficha genérica usa characters.build.engine e guarda profile/overrides; fichas legadas mantêm o caminho existente.

CP1 concluído para ações horizontais e layout. CP2 implementado para perfis isolados e preservação do adaptador Estigma, sem migração completa de suas regras. CP3 parcialmente implementado: seleção de presets, editor e fichas genéricas; conteúdo oficial e migrações ainda pendentes. CP4/CP5 receberam melhorias de preparação e acesso, mas não estão concluídos.

Próximo lote sugerido: concluir regras/catálogos com fontes verificadas e aplicação controlada de atualizações de perfil; depois assistente visual de mapas e editor avançado de acessos. Manter a névoa fora do escopo até autorização específica.
