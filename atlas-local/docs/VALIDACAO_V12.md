# Validação V12 — 24/10/2026

- 30 testes Python aprovados, incluindo seis testes de névoa: pixels protegidos, cópias idênticas, permissões, histórico, conflitos, persistência, filtragem de tokens/terreno/iniciativa, movimento, envio atômico, navegação, transparência e orientação EXIF.
- 8 testes JavaScript aprovados: geometria hexagonal, posicionamento, caminhos, custo e catálogo de tokens.
- Suíte ui_fog aprovada: interação real por arraste, imagem recebida pelo jogador, ocultação de tokens, ausência de custo de movimento, desfazer/refazer, prévia, recarregamento, celular e envio já coberto.
- Cinco suítes de regressão aprovadas: ui_workspace, ui_assets, ui_history, ui_combat_live e ui_smoke. Total: seis suítes de navegador aprovadas nesta entrega.
- Inspeção visual do painel de névoa em desktop e celular. Capturas são apenas instrumentos internos de validação.
- O empacotador verifica hashes dos 509 registros de assets da campanha e das oito imagens de tokens; valida CRC dos três ZIPs e ausência de arquivos duplicados entre as partes.

Não constitui auditoria completa de segurança. Teste real entre PCs via LAN/Radmin ainda pendente. A máscara é manual e compartilhada, não oferece visão individual ou paredes/luzes. Antes da migração para esquema 7, faça backup de data/.
