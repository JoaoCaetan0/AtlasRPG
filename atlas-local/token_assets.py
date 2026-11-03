"""Bundled public artwork. Scene placement/visibility remains private in combat.py."""
import json
from pathlib import Path

CATALOG = json.loads((Path(__file__).parent / 'web/tokens/catalog.json').read_text(encoding='utf-8'))
TOKEN_IDS = frozenset(item['id'] for item in CATALOG)

def static_routes():
    routes = {'/tokens/catalog.json': ('tokens/catalog.json', 'application/json; charset=utf-8')}
    for item in CATALOG:
        routes['/tokens/' + item['id'] + '.png'] = ('tokens/' + item['id'] + '.png', 'image/png')
    return routes
