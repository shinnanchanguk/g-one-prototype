import json, math, sys, re
src, out = sys.argv[1], sys.argv[2]
d = json.load(open(src))
fs = [f for f in d['features'] if str(f['properties']['code']).startswith('31')]
def city(n):
    m = re.match(r'(.+?시)(.+구)$', n)
    return m.group(1) if m else n
pts=[]
def rings(g):
    if g['type']=='Polygon': return g['coordinates']
    return [r for p in g['coordinates'] for r in p]
for f in fs:
    for r in rings(f['geometry']): pts += r
lat0 = sum(p[1] for p in pts)/len(pts); k = math.cos(math.radians(lat0))
xs=[p[0]*k for p in pts]; ys=[-p[1] for p in pts]
minx,maxx,miny,maxy=min(xs),max(xs),min(ys),max(ys)
W=800; s=W/(maxx-minx); H=round((maxy-miny)*s)
P=lambda lon,lat: ((lon*k-minx)*s, (-lat-miny)*s)
cities={}
for f in fs:
    c=city(f['properties']['name'])
    e=cities.setdefault(c,{'name':c,'paths':[],'pts':[]})
    for r in rings(f['geometry']):
        q=[P(*p) for p in r]
        e['pts']+=q
        e['paths'].append('M'+'L'.join(f'{x:.1f},{y:.1f}' for x,y in q)+'Z')
res=[]
for c in cities.values():
    xs=[p[0] for p in c['pts']]; ys=[p[1] for p in c['pts']]
    res.append({'name':c['name'],'cx':round(sum(xs)/len(xs),1),'cy':round(sum(ys)/len(ys),1)})
res.sort(key=lambda r:r['name'])
# 지도 보기를 뺀 뒤로는 시군 중심 좌표만 쓴다(이웃 지원청 고르기·저장값 검사)
open(out,'w').write('// 경기도 31개 시군 중심 좌표(통계청 2013 경계, southkorea-maps 단순화본에서 scripts/build-map.py 로 생성). 이웃 지원청 고르기와 저장값 검사에 쓴다.\n'
  'export const CITIES = '+json.dumps(res,ensure_ascii=False,separators=(',',':'))+';\n')
print(len(res), W, H)
