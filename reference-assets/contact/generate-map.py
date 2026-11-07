"""Prepare a local illustrated neighbourhood map from primary OpenStreetMap data.

All road and footprint positions come from OSM. Extrusion depths are visual styling,
not surveyed building heights. This script does not request any external data.
"""
from pathlib import Path
import json, math, html, xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "dist/assets/contact"
OUT.mkdir(parents=True, exist_ok=True)
SOURCE = Path(__file__).with_name("elahiyeh-osm.xml")
WEST, SOUTH, EAST, NORTH = 51.4085, 35.7846, 51.4331, 35.7975
LON0, LAT0 = (WEST + EAST) / 2, (SOUTH + NORTH) / 2
M_PER_DEG = 111195.08
COS = math.cos(math.radians(LAT0))
METRES_W, METRES_H = (EAST-WEST)*M_PER_DEG*COS, (NORTH-SOUTH)*M_PER_DEG
SCALE = min(1100/METRES_W, 680/METRES_H)
W, H = METRES_W*SCALE, METRES_H*SCALE
X0, Y0 = (1200-W)/2, (780-H)/2

def project(lon, lat):
    return [round(X0+(lon-WEST)*M_PER_DEG*COS*SCALE, 1),
            round(Y0+(NORTH-lat)*M_PER_DEG*SCALE, 1)]

def path(points, closed=False):
    if not points: return ""
    return "M"+"L".join(f"{p[0]:g} {p[1]:g}" for p in points)+( "Z" if closed else "")

def simplify(points, epsilon=.45):
    if len(points)<3:return points
    a,b=points[0],points[-1]
    dx,dy=b[0]-a[0],b[1]-a[1]
    def distance(p):
        if not dx and not dy:return math.hypot(p[0]-a[0],p[1]-a[1])
        t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)))
        return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)
    distances=[distance(p) for p in points[1:-1]]
    maximum=max(distances,default=0)
    if maximum<=epsilon:return [a,b]
    index=distances.index(maximum)+1
    return simplify(points[:index+1],epsilon)[:-1]+simplify(points[index:],epsilon)

def centroid(points):
    p=points[:-1] if len(points)>1 and points[0]==points[-1] else points
    return [round(sum(v[k] for v in p)/len(p),1) for k in (0,1)]

tree=ET.fromstring(SOURCE.read_bytes())
nodes={n.attrib["id"]:project(float(n.attrib["lon"]),float(n.attrib["lat"])) for n in tree.findall("node")}
buildings,roads,parks=[],[],[]
road_types={"motorway","motorway_link","trunk","trunk_link","primary","primary_link","secondary","secondary_link","tertiary","tertiary_link","residential","living_street","unclassified","service","pedestrian","footway","steps","path"}
for way in tree.findall("way"):
    tags={t.attrib["k"]:t.attrib["v"] for t in way.findall("tag")}
    points=[nodes[n.attrib["ref"]] for n in way.findall("nd") if n.attrib["ref"] in nodes]
    if len(points)<2:continue
    if max(p[0] for p in points)<X0 or min(p[0] for p in points)>X0+W or max(p[1] for p in points)<Y0 or min(p[1] for p in points)>Y0+H:continue
    closed=points[0]==points[-1]
    points=simplify(points)
    info={"id":int(way.attrib["id"]),"points":points}
    for k in ("name","name:en","building:levels"):
        if k in tags:info[k.replace(":","_")]=tags[k]
    if tags.get("building") and closed and len(points)>=4:
        try:levels=float(tags.get("building:levels","0"))
        except ValueError:levels=0
        info["centroid"]=centroid(points)
        info["rise"]=round(min(12,levels*1.15) if levels else 3+(int(way.attrib["id"])%7)*.38,1)
        info["isMall"]=way.attrib["id"]=="1192581831"
        buildings.append(info)
    elif tags.get("highway") in road_types:
        info["kind"]=tags["highway"]
        roads.append(info)
    elif closed and (tags.get("leisure") in ("park","garden","playground") or tags.get("landuse") in ("grass","forest","orchard","recreation_ground") or tags.get("natural")=="wood"):
        info["kind"]=tags.get("leisure",tags.get("landuse",tags.get("natural")))
        parks.append(info)

buildings.sort(key=lambda b:b["centroid"][1])
major={"motorway","motorway_link","trunk","trunk_link","primary","primary_link"}
middle={"secondary","secondary_link","tertiary","tertiary_link"}
walk={"footway","pedestrian","path","steps"}
def road_class(r):return "major" if r["kind"] in major else "middle" if r["kind"] in middle else "walk" if r["kind"] in walk else "local"

official_point={"lat":35.7911174,"lon":51.4207593}
pin=project(official_point["lon"],official_point["lat"])
directions="https://www.google.com/maps/place/Melal%2BBoutique%2BMall/@35.7911174,51.4181844,17z/data=!3m1!4b1!4m6!3m5!1s0x3f8e0672751b1753:0xed4d880692ab6ad3!8m2!3d35.7911174!4d51.4207593!16s%2Fg%2F11c0xszpbz?entry=ttu&g_ep=EgoyMDI1MDMxMC4wIKXMDSoASAFQAw%3D%3D"
sources={
 "officialAddress":"https://mellalgallery.com/fa/contact/",
 "officialDirections":directions,
 "osmMall":"https://www.openstreetmap.org/way/1192581831",
 "osmMallApi":"https://api.openstreetmap.org/api/0.6/way/1192581831/full",
 "osmMapApi":f"https://api.openstreetmap.org/api/0.6/map?bbox={WEST},{SOUTH},{EAST},{NORTH}",
 "copyright":"https://www.openstreetmap.org/copyright"
}
data={"version":1,"viewBox":[0,0,1200,780],"bbox":[WEST,SOUTH,EAST,NORTH],"extent":{"widthMetres":round(METRES_W),"heightMetres":round(METRES_H)},"metresToSvg":round(SCALE,6),"place":{"name_fa":"الهیه، بوتیک‌مال ملل","name_en":"Elahiyeh · Melal Boutique Mall",**official_point,"point":pin,"osmWay":1192581831},"sources":sources,"attribution":"© OpenStreetMap contributors","license":"ODbL 1.0","heightsAreStylized":True,"buildings":buildings,"roads":roads,"parks":parks}
(OUT/"map-data.json").write_text(json.dumps(data,ensure_ascii=False,separators=(",",":")))

s=[f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1200 780" role="img" aria-labelledby="mapTitle mapDesc">
<title id="mapTitle">الهیه، شمیران — موقعیت بوتیک‌مال ملل</title>
<desc id="mapDesc">نقشهٔ محله بر پایهٔ خیابان‌ها و ردپای ساختمان‌های واقعی OpenStreetMap. ارتفاع‌ها صرفاً برای نمایش هنری‌اند.</desc>
<defs><clipPath id="elahiyehClip"><rect x="{X0:.1f}" y="{Y0:.1f}" width="{W:.1f}" height="{H:.1f}" rx="18"/></clipPath><radialGradient id="mallGlow"><stop stop-color="#b49b70" stop-opacity=".22"/><stop offset="1" stop-color="#b49b70" stop-opacity="0"/></radialGradient></defs>
<style>
.map-ground{{fill:#f3ede1}}.map-park{{fill:#dfe2d4;stroke:#ccd2c0;stroke-width:.65}}.map-road{{fill:none;stroke:#ede6d8;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}}.map-road-casing{{fill:none;stroke:#b8ad9a;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke;opacity:.55}}.map-road-major{{stroke-width:8}}.map-road-major.map-road-casing{{stroke-width:9.4}}.map-road-middle{{stroke-width:4.5}}.map-road-middle.map-road-casing{{stroke-width:5.5}}.map-road-local{{stroke-width:2.8}}.map-road-local.map-road-casing{{stroke-width:3.6}}.map-road-walk{{stroke-width:1;stroke:#b6ac98;opacity:.6}}.map-building-side{{fill:#b9ab93;stroke:#b3a58c;stroke-width:.28}}.map-building-roof{{fill:#e9dfcd;stroke:#b7aa94;stroke-width:.45}}.map-building:nth-child(3n) .map-building-roof{{fill:#e3d8c4}}.map-building:nth-child(5n) .map-building-roof{{fill:#eee6d9}}.map-building.is-mall .map-building-roof{{fill:#a58e62;stroke:#74613f;stroke-width:1.2}}.map-building.is-mall .map-building-side{{fill:#7e6b49;stroke:#74613f}}.map-pin{{color:#7c6744}}.map-pin-ring{{fill:none;stroke:currentColor;stroke-width:1;opacity:.65}}.map-pin-core{{fill:currentColor;stroke:#f7f1e5;stroke-width:2}}.map-street-label{{fill:#736954;font-family:Vazirmatn,Arial,sans-serif;font-size:10;paint-order:stroke;stroke:#f3ede1;stroke-width:3;stroke-linejoin:round;letter-spacing:.02em}}.map-credit{{fill:#8b806c;font:8.5px Georgia,serif;letter-spacing:.4px}}.map-scale{{fill:none;stroke:#877b64;stroke-width:1}}.map-north{{fill:#736954;font:11px Georgia,serif}}
</style>
<rect class="map-ground" x="{X0:.1f}" y="{Y0:.1f}" width="{W:.1f}" height="{H:.1f}" rx="18"/>
<g clip-path="url(#elahiyehClip)">
<g id="map-parks" class="map-parks" data-layer="parks">''']
for p in parks:s.append(f'<path class="map-park" d="{path(p["points"],True)}"/>')
s.append('</g><g id="map-roads" class="map-roads" data-layer="roads">')
for klass in ("walk","local","middle","major"):
    group=[r for r in roads if road_class(r)==klass]
    if klass!="walk":
        for r in group:s.append(f'<path class="map-road-casing map-road-{klass}" d="{path(r["points"])}"/>')
    for r in group:s.append(f'<path class="map-road map-road-{klass}" data-osm="{r["id"]}" d="{path(r["points"])}"/>')
s.append('</g><g id="map-buildings" class="map-buildings" data-layer="buildings">')
for i,b in enumerate(buildings):
    pts=b['points'][:-1] if b['points'][0]==b['points'][-1] else b['points']
    rise=9 if b['isMall'] else b['rise'];dx,dy=-rise*.24,-rise
    lifted=[[round(x+dx,1),round(y+dy,1)] for x,y in pts]
    area=sum(pts[j][0]*pts[(j+1)%len(pts)][1]-pts[(j+1)%len(pts)][0]*pts[j][1] for j in range(len(pts)))
    sign=1 if area>=0 else -1
    sides=[]
    for j in range(len(pts)):
        k=(j+1)%len(pts);ex,ey=pts[k][0]-pts[j][0],pts[k][1]-pts[j][1]
        if sign*(ey*.24-ex)>0:sides.append(path([pts[j],pts[k],lifted[k],lifted[j]],True))
    cls='map-building is-mall' if b['isMall'] else 'map-building'
    mid=' id="mall-footprint"' if b['isMall'] else ''
    cx,cy=b['centroid']
    s.append(f'<g{mid} class="{cls}" data-i="{i}" data-osm="{b["id"]}" data-cx="{cx:g}" data-cy="{cy:g}" data-rise="{rise:g}" style="--i:{i};--rise:{rise:g}px"><path class="map-building-side" d="{"".join(sides)}"/><path class="map-building-roof" d="{path(lifted,True)}"/></g>')
s.append('</g><g id="map-labels" class="map-labels" data-layer="labels">')
labels={"ولی عصر":("ولیعصر","Valiasr"),"مرتضی فیاضی":("فرشته (فیاضی)","Fereshteh (Fayyazi)"),"بوسنی هرزگوین":("بوسنی هرزگوین","Bosnia & Herzegovina"),"بزرگراه آیت الله مدرس":("مدرس","Modarres"),"بلوار نلسون ماندلا":("نلسون ماندلا","Nelson Mandela")}
for name,(fa,en) in labels.items():
    matches=[r for r in roads if r.get('name')==name]
    if not matches:continue
    # Prefer the longest segment whose midpoint is comfortably within the drawing.
    usable=[]
    for r in matches:
        p=r['points'][len(r['points'])//2]
        if X0+35<p[0]<X0+W-35 and Y0+35<p[1]<Y0+H-35:
            length=sum(math.dist(r['points'][j],r['points'][j+1]) for j in range(len(r['points'])-1));usable.append((length,p))
    if not usable:continue
    _,p=max(usable)
    s.append(f'<text class="map-street-label" x="{p[0]:g}" y="{p[1]-7:g}" text-anchor="middle" direction="rtl" data-fa="{html.escape(fa,quote=True)}" data-en="{html.escape(en,quote=True)}">{html.escape(fa)}</text>')
s.append('</g>')
x,y=pin
s.append(f'<g id="mall-pin" class="map-pin" data-layer="pin" transform="translate({x:g} {y-8:g})"><circle class="map-pin-glow" r="38" fill="url(#mallGlow)"/><circle class="map-pin-ring map-pin-pulse" r="16"/><circle class="map-pin-ring" r="9"/><circle class="map-pin-core" r="4.5"/></g>')
s.append('</g>')
scale_len=200*SCALE
s.append(f'<g class="map-scale" transform="translate({X0+24:.1f} {Y0+H-24:.1f})"><path d="M0 -4V0H{scale_len:.1f}V-4"/><text x="{scale_len/2:.1f}" y="-9" text-anchor="middle" style="fill:#877b64;stroke:none;font:8px Georgia,serif">200 m</text></g>')
s.append(f'<g transform="translate({X0+W-26:.1f} {Y0+30:.1f})"><path d="M0 15V-5M-3 -1L0 -7L3 -1" fill="none" stroke="#736954" stroke-width="1"/><text class="map-north" x="0" y="-12" text-anchor="middle">N</text></g>')
s.append('<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer"><text class="map-credit" x="600" y="763" text-anchor="middle">© OpenStreetMap contributors · ODbL</text></a></svg>')
svg=''.join(s)
(OUT/'elahiyeh-map.svg').write_text(svg)
notes={"purpose":"Approved contact page neighbourhood map", "source":"OpenStreetMap API primary data", "downloaded":"2026-11-06", "counts":{"buildings":len(buildings),"roads":len(roads),"greenAreas":len(parks)},"verifiedMallPoint":official_point,"osmMallWay":1192581831,"sources":sources,"mapDescription":{"fa":"نمای هنری محلهٔ الهیه بر پایهٔ خیابان‌ها و ردپای ساختمان‌های واقعی؛ ارتفاع‌ها صرفاً نمایشی‌اند.","en":"An illustrated Elahiyeh neighbourhood view based on real streets and building footprints; building heights are stylised."},"rootIntegration":{"svg":"assets/contact/elahiyeh-map.svg","json":"assets/contact/map-data.json","groups":["map-parks","map-roads","map-buildings","map-labels","mall-pin"],"buildingAttributes":["data-i","data-cx","data-cy","data-rise"],"attribution":"Keep a visible © OpenStreetMap contributors link to https://www.openstreetmap.org/copyright when embedding or restyling this map."}}
(OUT/'map-sources.json').write_text(json.dumps(notes,ensure_ascii=False,indent=2))
(OUT/'ATTRIBUTION.txt').write_text('Map data © OpenStreetMap contributors, available under the Open Database License (ODbL).\nhttps://www.openstreetmap.org/copyright\n\nAll road and building footprint positions are derived from the bounded OSM primary dataset. Extrusion depths and colours are artistic styling, not measured building heights.\nThe mall pin is the point linked from the official Mellal Gallery contact page; it identifies the mall, not a specific office unit.\n')
print(json.dumps({"svgBytes":len(svg.encode()),"dataBytes":(OUT/'map-data.json').stat().st_size,"counts":notes['counts'],"pin":pin,"out":str(OUT)},ensure_ascii=False))
