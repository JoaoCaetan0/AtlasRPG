import sys,time,json,statistics,random
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import token_vision,fog
from vision_cp17_reference import sight as reference
cases={str(n):tuple((i%4-2,i//4-1,8,160,(i*67)%360) for i in range(n)) for n in (1,4,12)}
report={}
for label,sources in cases.items():
 report[label]={}
 for name,fn in [('cp17',reference),('current',token_vision.sight)]:
  durations=[]
  for i in range(12):
   fn.cache_clear();start=time.perf_counter();mask=fn(fog.REVEALED,700,35,5,sources);durations.append((time.perf_counter()-start)*1000)
  report[label][name]={'median_ms':round(statistics.median(durations),3),'samples':12}
 assert reference(fog.REVEALED,700,35,5,sources)==token_vision.sight(fog.REVEALED,700,35,5,sources)
print(json.dumps(report,indent=2))
