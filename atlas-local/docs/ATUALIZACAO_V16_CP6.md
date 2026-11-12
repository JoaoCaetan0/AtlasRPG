# Atlas V16 CP6 — animações e fórmulas pessoais

## Entregue
- Sólidos tridimensionais de d4, d6, d8, d10, d12 e d20, projetados em canvas com rotação breve. d100 usa dois d10: dezenas e unidades; 00 + 0 representa 100. Fate usa um cubo; dados incomuns continuam com símbolo e valor exato.
- A animação é ilustrativa, sem simulação física. Os sólidos não possuem numeração nas faces: o resultado do servidor aparece abaixo de cada sólido, independente da orientação final.
- Mesma animação no chat e no painel, somente para quem enviou a rolagem. Checkbox para desativar em cada formulário. Preferência de movimento reduzido produz uma imagem estática. Até 40 resultados animados; histórico completo preservado.
- Até 30 favoritos por usuário e mesa, persistidos no servidor. Cada favorito guarda nome, expressão, descrição e visibilidade. Nome igual atualiza o existente. Excluir afeta apenas o próprio favorito.
- Favoritos ficam em uma seção recolhível. Carregar não sorteia: permite revisar antes de clicar em Rolar dados.
- Botão Usar fórmula em cada card: no painel preenche os campos; no chat prepara um comando. Sempre preserva a visibilidade da rolagem carregada.
- Validação sintática antes de salvar favoritos, sem sortear. Erros de execução, como divisão por zero, continuam validados ao rolar.
- Não requer CDN, internet ou bibliotecas novas de renderização.

## Instalar
Feche o servidor. Faça backup de data/. Mescle atlas-local na instalação existente, substituindo os arquivos do programa e preservando data/ e campaign/. Reinicie e use Ctrl+F5. A tabela adicional dice_favorites é criada na inicialização; demais dados são preservados. O número do schema permanece 14.
Pacote cumulativo com 36 tokens. Mapas e documentos particulares dependem da sua instalação existente.

## Verificação
- Python: 66 testes, 64 aprovados e 2 ignorados.
- Node: 10 testes aprovados, incluindo número de faces de cada sólido, arestas compartilhadas, coordenadas finitas, d100 e movimento reduzido.
- JavaScript: verificação de sintaxe de todos os módulos.
- HTTP: favoritos isolados por usuário, validação, limite, atualização, persistência e nenhuma rolagem ao salvar.
- Sem navegador instalado neste ambiente: validação visual e interação em Opera/Windows ainda pendentes. Não foi realizado teste de desempenho em dispositivo real.

## Checkpoint da próxima etapa
1. Validar a aparência das animações e favoritos em uso real.
2. Visão por token: alcance geral com substituição individual; círculo ou cone ajustável (sugestão inicial 160°), orientação manual, prévia do mestre como jogador, união de tokens controlados e proteção da imagem no servidor.
3. Depois: paredes, portas, fontes de luz e memória de exploração. Não foram alteradas neste pacote.
4. Aperfeiçoamentos futuros de dados: favoritos de mesa compartilhados, referências explícitas a atributos da ficha e faces numeradas alinhadas ao resultado, sem prometer sintaxe integral do Rollem.
Arrombamento e furtividade seguem fora do Atlas.

## Referências técnicas consultadas
- https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
