# Validação V10 — 24/10/2026

- 24 testes Python aprovados, incluindo API autenticada, permissões, PDF real, navegação, custos e histórico de combate.
- 8 testes JavaScript aprovados: geometria, colocação de tokens, percurso com passos adjacentes, custo de terreno/bloqueios e catálogo.
- Quatro suítes Chromium aprovadas: ui_smoke.cjs, ui_assets.cjs, ui_history.cjs, ui_combat_live.cjs.
- Nova suíte com mestre e jogador em contextos isolados: ativação do grid em um clique; tamanho; criação e edição de token; movimento pelo jogador recebido pelo mestre mesmo com foco na grade; régua sem gasto; iniciativa recebida durante janela aberta; recuperação de falha simulada de GET; troca de mapa automática; ausência de transbordamento horizontal no celular.
- Teste do editor com structuredClone indisponível, simulando essa limitação de API no acesso HTTP. Teste executado em loopback; a infraestrutura não expõe uma interface LAN para teste real. Radmin entre PCs e navegadores do usuário ainda precisam de validação em campo.
- Inspeção visual interna da versão móvel: grid cobre a imagem, painel fica abaixo do mapa e botões permanecem acessíveis. Evidências de navegador não fazem parte da entrega.
- Preservados os testes de inserção por clique/arrastar/lote, ocultação para jogadores, edição de aparência, desfazer/refazer e persistência.

A validação não usa dados privados do usuário e não prova uma causa única para o problema relatado em sua instalação. Não há alteração no esquema 6 do banco.

Empacotamento: package_release.py confere todos os hashes de 509 assets da campanha e oito artes de tokens, verifica CRC dos três ZIPs e impede duplicação/omissão de arquivos. VERIFICACAO.json registra tamanho e SHA-256 dos pacotes.
