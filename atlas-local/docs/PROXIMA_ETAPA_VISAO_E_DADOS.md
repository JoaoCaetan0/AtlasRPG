# Próxima etapa — visão por token e rolagens

Status: proposta para discussão, não implementada nesta entrega. Arrombamento e furtividade não entram no Atlas.

## Visão: opções a apresentar

1. Circular: alcance em metros ao redor do token. Base simples para visão individual.
2. Cone direcional: alcance, abertura e orientação. Sugestão inicial de 160°, editável; opção 360°. O cone deve girar por uma alça visível e também por campo numérico/controle acessível no celular. Girar a visão não deve gastar movimento por padrão.
3. Cone com paredes e iluminação: segunda fase; barreiras, portas, luz ambiente e fontes de luz independentes da capacidade de enxergar. Não tratar luz emitida como visão do token.

Configuração visual: card Visão no token selecionado, chave ativar, alcance e modo; abertura/orientação aparecem apenas no modo cone. Padrão por mesa/cena e sobrescrita individual. Mestre pode testar “Ver como este jogador”, com aviso visível e saída fácil. Jogador com vários tokens recebe a união das áreas permitidas; sem token atribuído, deve haver aviso claro, sem liberar o mapa inteiro.

Sem névoa ativa, o mapa segue integralmente visível. Com névoa, definir a precedência entre ocultação manual e visão automática: recomendação é manter uma camada de segredo permanente controlada pelo mestre. Memória de áreas exploradas é opcional; criaturas fora da visão atual não permanecem reveladas nela.

Requisito de segurança: calcular autorização e visibilidade no servidor, não mandar mapa integral e coordenadas secretas para depois esconder só com CSS. Avaliar máscaras/recortes por jogador, cache por revisão e atualização após movimento confirmado; nunca reaproveitar resposta de outro jogador. Os limites geométricos precisam acompanhar zoom, escala do grid, troca de horário e mapa. Testar paredes, bordas, teleporte, desconexão e mudança de dono do token.

## Dados no chat

O código atual já tem um interpretador limitado da notação Rollem V1 em dice.py, com sorteio no servidor. O chat ainda grava texto. Reutilizar o motor em vez de construir um segundo.

Primeira opção: comandos explícitos /r e /roll no chat. Exemplos: /r 1d20+3; /r 4d6d1; /r 6#4d6d1; /r 5d6>>4. Descrição em campo separado ou delimitador claramente documentado. O Rollem também reconhece mensagens parecidas com rolagens; no Atlas, oferecer isso como opção futura por mesa, para evitar interpretar conversa normal como comando.

Criar matriz de compatibilidade com Rollem V1: operações, precedência, manter/descartar, explosões, Fate, repetições, comparações e modificadores. Não prometer compatibilidade total antes dos testes. V2 do Rollem está documentada como WIP e não é o alvo inicial. Casos de erro devem apontar a posição e manter a expressão digitada.

Chat e painel devem exibir o mesmo evento de rolagem e identificador. Reenvio por reconexão não pode sortear duas vezes. Públicos, só mestre+autor e pessoais mantêm exatamente as mesmas permissões no histórico e nas animações. Fórmulas de ficha devem ser validadas por lista de operações permitidas, sem eval; atributos ausentes geram erro, nunca zero silencioso.

## Animação e UI

Substituir o cubo genérico atual por representação individual de d4, d6, d8, d10, d12, d20 e d100 (par de d10). Fate tem símbolos próprios; dados de faces incomuns do Estigma, como d14/d16/d18, precisam de representação claramente identificada, sem fingir ser d20. Todo resultado visual vem do evento confirmado pelo servidor; animação não decide nem altera sorteio.

Proposta visual: bandeja breve sobre o mapa, sem bloquear controles. Cards com total em destaque, fórmula e modificadores, dados individuais, descartes riscados e explosões agrupadas. Cores acompanhadas de texto/ícones. Histórico com filtros e “repetir fórmula” explícito. Atalhos de quantidade e tipo de dado, prévia da expressão e favoritos por jogador.

Acessibilidade/desempenho: opção sem animação, respeitar prefers-reduced-motion, som desligável, controles por teclado/toque. Para centenas de dados, mostrar animação limitada com contador e manter todos os resultados no detalhamento. Preferência inicial: animação só para quem rolou; não revelar rolagem privada a outros jogadores.

## Ordem e critérios de aceite

1. Contrato de eventos e matriz Rollem; comandos no chat e UI dos resultados. Testes de visibilidade, reenvio, sintaxe e cálculos.
2. Representações por dado e animações. Resultado final idêntico ao servidor, repetidos não fundidos, descartes preservados, modo reduzido funcional.
3. Visão circular/cone com prévia de mestre. Testes de isolamento entre jogadores e ausência de dados ocultos nas respostas.
4. Paredes, portas, luz e exploração persistente, após medir desempenho.

Referências: https://rollem.rocks/docs/v1-syntax ; https://rollem.rocks/docs/v1-syntax/dice-math ; https://rollem.rocks/docs/v2-syntax ; https://help.roll20.net/hc/en-us/articles/11786989363479-Using-Dynamic-Lighting-As-A-Player ; https://bloghub.roll20.net/posts/three-updates-for-updated-dynamic-lighting/
