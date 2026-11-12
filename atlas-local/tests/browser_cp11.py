"""Optional real Chromium smoke test; isolated data and two authenticated browsers."""
import sys,time,json,http.cookiejar
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from test_live_rotation import LiveRotation
from playwright.sync_api import sync_playwright

def main():
 fixture=LiveRotation();fixture.setUp()
 try:
  fixture.setup_scene()
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
   errors=[];pages=[]
   for client in (fixture.gm,fixture.player):
    ctx=browser.new_context(viewport={'width':1440,'height':900})
    jar=next(h.cookiejar for h in client.http.handlers if hasattr(h,'cookiejar'))
    ctx.add_cookies([{'name':c.name,'value':c.value,'url':fixture.base} for c in jar])
    page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(fixture.base);page.locator('[data-open]').first.click()
    page.locator('[data-token="hero"] .token-art').wait_for()
    pages.append(page)
   gm,player=pages
   # Actual gesture, without releasing: other browser must rotate before commit.
   node=gm.locator('[data-token="hero"] circle').first
   box=node.bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
   before=player.locator('[data-token="hero"] .token-art').get_attribute('transform')
   gm.mouse.move(x,y);gm.mouse.down();gm.mouse.move(x+60,y+60,steps=5)
   player.wait_for_function("old=>document.querySelector('[data-token=hero] .token-art').getAttribute('transform')!==old",arg=before)
   during=player.locator('[data-token="hero"] .token-art').get_attribute('transform')
   gm.mouse.up();player.wait_for_timeout(500)
   assert before!=during,(before,during)
   # Preparation and switching to an already-authorized image.
   gm.evaluate("args=>api('scene-preload',args)",fixture.args)
   player.wait_for_timeout(700)
   import realtime
   assert fixture.pid in realtime._preloads[fixture.tid]['ready']
   gm.evaluate("args=>api('scene',args)",{**fixture.args,'asset_id':fixture.alias})
   player.wait_for_function("aid=>document.querySelector('#battle > image')?.getAttribute('href').includes(aid)",arg=fixture.alias)
   assert not errors,errors
   print(json.dumps({'browser':'Chromium','live_rotation_before_release':True,'preload_ready':True,'scene_switch':True,'page_errors':errors}))
   browser.close()
 finally:fixture.tearDown()
if __name__=='__main__':main()
