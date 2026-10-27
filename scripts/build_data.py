#!/usr/bin/env python3
"""Build the website's JSON data files from the supplied handoff data.

Inputs  : data/source_equipment_seed.csv, data/source_planetary_cards.json
Outputs : data/equipment.json, missions.json, planetary.json, timeline.json, sources.json, site.json
Nothing is invented: every value comes from the inputs. Editorial mappings
(status category, type category, mass comparability, event type) are listed below
and recorded on each record with a *_basis field so they can be reviewed.
"""
import csv, json, re, os
from urllib.parse import urlparse

HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(HERE, '..', 'data')


def j(s):
    if s is None or s.strip() == '':
        return None
    try:
        return json.loads(s)
    except Exception:
        return s.strip()


def val(s):
    s = (s or '').strip()
    return s or None


MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
               'September', 'October', 'November', 'December']


def fmt_label(v, p):
    if p == 'year':
        return v
    y = v[:4]
    if p == 'month':
        return f"{MONTH_NAMES[int(v[5:7]) - 1]} {y}"
    return f"{int(v[8:10])} {MONTH_NAMES[int(v[5:7]) - 1]} {y}"


def date_obj(raw, iso=None):
    """Return {value, precision, label, raw} or None. Never invents precision."""
    raw = val(raw)
    iso = val(iso)
    if not raw and not iso:
        return None
    src = iso or raw
    if re.search(r'\d/\d|differ|discrepancy', raw or ''):
        mm = re.match(r'^(\d{4}-\d{2}-\d{2})', raw)
        return {'value': mm.group(1) if mm else None, 'precision': 'conflicting',
                'label': 'Sources differ (see note)', 'raw': raw}
    m = re.match(r'^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?(?![\d/])', src)
    if not m:
        return {'value': None, 'precision': 'unknown', 'label': raw, 'raw': raw}
    v = m.group(0)
    p = 'day' if m.group(3) else 'month' if m.group(2) else 'year'
    return {'value': v, 'precision': p, 'label': fmt_label(v, p), 'raw': raw}


# ---- editorial mappings (documented in README; owner review required) ---------------
STATUS = {
    'M001': ('green', 'Mission outcome recorded as successful; descent stage is non-operational (this is not a statement that hardware operates).'),
    'M002': ('green', 'Rover operations ended with Apollo 15 surface activities after successful traverses.'),
    'M003': ('red', 'Record states contact with the spacecraft ended on 1967-01-07.'),
    'M006': ('green', 'Mission ended by a commanded lunar impact after a successful mapping mission (planned end).'),
    'M007': ('yellow', 'Record: active mission per NASA Science page checked 2026-10-23.'),
    'R001': ('red', 'Record: communications stopped after a faulty command on 1982-11-11.'),
    'R002': ('red', 'Record: ended; final operations 1980-04-11/12 (reason for the end is not stated in the seed).'),
    'R003': ('red', 'Record: last data 1997-09-27; recovery attempts failed; mission formally terminated 1998-03-10.'),
    'R004': ('red', 'Record: last Pathfinder transmission 1997-09-27; recovery efforts ended 1998-03-10.'),
    'R005': ('red', 'Record: last confirmed communication 2010-03-22; contact attempts ended 2011.'),
    'R006': ('red', 'Record: last communication 2018-06-10 during a dust storm; mission declared ended 2019-02-13.'),
    'R007': ('yellow', 'Record: active; NASA updates current in October 2026.'),
    'R008': ('yellow', 'Record: active; NASA reported driving distance on 2026-10-11.'),
    'R009': ('red', 'Record: flight operations ended 2024-01-25 after rotor-blade damage.'),
    'R010': ('red', 'Record: mission ended November 2008; no longer communicating.'),
    'R011': ('red', 'Record: retired December 2022 after missed communications and exhausted power.'),
    'R013': ('yellow', 'Record: active; listed as ongoing by NASA in April 2026.'),
    'R015': ('yellow', 'Record: listed as active in the NASA Mars overview as of the 2026 audit.'),
    'R016': ('red', 'Record: unexpected loss of contact after 2025-12-06; mission declared ended 2026-06-03.'),
}
TYPES = {  # Rovers, Landers, Orbiters, Spacecraft, Helicopters, Descent stages
    'M001': ['Landers', 'Descent stages', 'Spacecraft'], 'M002': ['Rovers'], 'M003': ['Landers', 'Spacecraft'],
    'M006': ['Orbiters', 'Spacecraft'], 'M007': ['Orbiters', 'Spacecraft'],
    'R001': ['Landers', 'Spacecraft'], 'R002': ['Landers', 'Spacecraft'], 'R003': ['Landers', 'Spacecraft'],
    'R004': ['Rovers'], 'R005': ['Rovers'], 'R006': ['Rovers'], 'R007': ['Rovers'], 'R008': ['Rovers'],
    'R009': ['Helicopters'], 'R010': ['Landers', 'Spacecraft'], 'R011': ['Landers', 'Spacecraft'],
    'R013': ['Orbiters', 'Spacecraft'], 'R015': ['Orbiters', 'Spacecraft'], 'R016': ['Orbiters', 'Spacecraft'],
}
MASS_COMPARABLE = {  # landed-vehicle mass values that carry an explicit vehicle/landing basis in the seed
    'M002': 'Deployed rover mass', 'R001': 'Lander mass at landing', 'R002': 'Lander mass at landing',
    'R004': 'Rover mass', 'R005': 'Rover vehicle mass', 'R006': 'Rover vehicle mass',
}
FEATURED = ['M001', 'M003', 'R001', 'R004', 'R005', 'R006', 'R009', 'R011']

EVENT_RULES = [  # first match wins
    (r'ended efforts to contact|declared|retirement|formally terminated|end of flight|commanded to impact', 'Mission end / retirement / final shutdown'),
    (r'last (confirmed )?(communication|signal|data)|contact with spacecraft ended|communications ended', 'Last confirmed contact'),
    (r'biosignature|marsquake|first image of earth', 'Scientific discovery / result'),
    (r'deployed|deployment', 'Deployment / release'),
    (r'orbit insertion|entered lunar orbit|arrived', 'Arrival / orbital insertion'),
    (r'land|touchdown', 'Landing / touchdown'),
    (r'^launch|launched', 'Launch'),
]


def classify(text):
    t = text.lower()
    for pat, typ in EVENT_RULES:
        if re.search(pat, t):
            return typ
    return 'Major mission operation'


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


ORG = {'science.nasa.gov': 'NASA Science', 'www.nasa.gov': 'NASA', 'nssdc.gsfc.nasa.gov': 'NASA NSSDC',
       'www.jpl.nasa.gov': 'NASA JPL', 'mars.nasa.gov': 'NASA Mars Exploration Program'}

rows = list(csv.DictReader(open(os.path.join(D, 'source_equipment_seed.csv'), encoding='utf-8-sig', newline='')))
equip, events, sources = [], [], {}


def add_source(url, record=None, claim=None, checked=None):
    if not url:
        return None
    u = urlparse(url)
    s = sources.setdefault(url, {'id': 'src_' + slug(u.netloc + u.path)[:80], 'url': url,
                                 'organisation': ORG.get(u.netloc, u.netloc), 'title': None,
                                 'record_level_for': [], 'claims': [], 'checked': set()})
    if record and record not in s['record_level_for']:
        s['record_level_for'].append(record)
    if claim:
        s['claims'].append(claim)
    if checked:
        s['checked'].add(checked)
    return s['id']


for r in rows:
    i = r['id']
    coords = j(r['coordinates'])
    mass = j(r['mass'])
    cat, basis = STATUS[i]
    dest = 'Moon' if r['destination'].startswith('Moon') else 'Mars' if r['destination'].startswith('Mars') else None
    assert dest, i
    hw = r['hardware_status_class']
    eq = {
        'id': i, 'name': r['equipment_name'], 'mission': r['mission_name'], 'mission_id': 'mis_' + slug(r['mission_name']),
        'agency': r['agency_country'], 'crew': r['human_or_robotic'],
        'type_raw': r['equipment_type'], 'type_categories': TYPES[i],
        'destination': dest, 'destination_detail': r['destination'],
        'status_category': cat, 'status_category_basis': basis,
        'mission_status_class': r['mission_status_class'], 'hardware_status_class': hw,
        'mission_outcome': r['mission_outcome'], 'operational_status': r['operational_status'],
        'physical_location': r['physical_location_category'], 'mission_objective': r['mission_objective'],
        'dates': {
            'launch': date_obj(r['launch_date'], r['launch_date_iso']),
            'arrival_or_landing': date_obj(r['arrival_or_landing_date'], r['arrival_date_iso']),
            'last_communication': date_obj(r['last_communication_date'], r['last_communication_date_iso']),
            'mission_end': date_obj(r['mission_end_date'], r['mission_end_date_iso']),
        },
        'coordinates': ({'latitude': coords['latitude'], 'longitude': coords['longitude'],
                         'convention': coords.get('longitude_convention'),
                         'reference': coords.get('coordinate_reference') or coords.get('coordinate_source')}
                        if isinstance(coords, dict) else None),
        'coordinate_note': val(r['coordinate_accuracy']), 'map_location_status': r['map_location_status'],
        'specs': j(r['technical_specifications']) or {}, 'instruments': j(r['scientific_instruments']) or [],
        'power_source': val(r['power_source']), 'dimensions': j(r['dimensions']), 'mobility': val(r['mobility_capabilities']),
        'remaining_hardware': val(r['remaining_hardware']),
        'mass': ({'value': mass['value'], 'unit': mass['unit'], 'basis': mass['basis']} if isinstance(mass, dict) else None),
        'mass_comparable_scope': MASS_COMPARABLE.get(i),
        'abandoned_surface': bool(re.search(r'SURFACE_HARDWARE_REMAINS|ROVER_REMAINS|IMPACTED_ON_MOON', hw)),
        'discoveries': j(r['major_discoveries']) or [], 'history': j(r['mission_history']) or [],
        'claims': j(r['source_claims']) or [], 'associated': j(r['associated_components']) or [],
        'uncertainty_notes': j(r['uncertainty_notes']) or [], 'missing_data_notes': j(r['missing_data_notes']) or [],
        'audit_flags': j(r['audit_flags']) or [], 'confidence': r['confidence'], 'confidence_notes': r['confidence_notes'],
        'review_state': r['review_state'], 'last_audited': r['last_audited_date'],
        'source_url': r['source_url'], 'source_note': r['source_note'], 'source_checked': r['source_checked_date'],
        'image': None, 'image_asset_status': r['image_asset_status'],
        'record_scope': r['record_scope'],
        'artifact_year': None,  # no source-backed artifact-year field exists in the seed; deliberately null
    }
    equip.append(eq)
    add_source(eq['source_url'], record=i, checked=eq['source_checked'])
    for c in eq['claims']:
        add_source(c.get('source_url'), claim={'equipment_id': i, 'claim': c.get('claim'), 'confidence': c.get('confidence')})
    for n, h in enumerate(eq['history']):
        d = date_obj(h['date'])
        su = h.get('source_url') or eq['source_url']
        if h.get('source_url'):
            add_source(h['source_url'], claim={'equipment_id': i, 'claim': h['event'], 'confidence': None})
        events.append({'id': f'evt_{i}_{n + 1}', 'date': d, 'title': h['event'], 'event_type': classify(h['event']),
                       'destination': dest, 'equipment_ids': [i], 'mission_id': eq['mission_id'], 'mission': eq['mission'],
                       'source_url': su,
                       'source_scope': 'event-specific URL' if h.get('source_url') else 'record-level URL (does not by itself verify this event)'})

missions = {}
for e in equip:
    m = missions.setdefault(e['mission_id'], {'id': e['mission_id'], 'name': e['mission'], 'agency': e['agency'],
                                              'destination': e['destination'], 'objective': e['mission_objective'],
                                              'equipment_ids': [], 'source_url': e['source_url']})
    m['equipment_ids'].append(e['id'])
missions = sorted(missions.values(), key=lambda m: m['name'])

pc = json.load(open(os.path.join(D, 'source_planetary_cards.json'), encoding='utf-8-sig'))
planetary = {'title': pc['title'], 'as_of_date': pc['as_of_date'], 'scope_note': pc['scope_note'], 'missions': []}
for m in pc['missions']:
    pm = dict(m)
    pm['dates'] = {}
    for k in ('launch_date', 'arrival_date', 'mission_end_date'):
        if m.get(k):
            pm['dates'][k] = date_obj(m[k])
    if m.get('launch_date_display'):
        pm['dates']['launch_date'] = {'value': '2004-08', 'precision': 'month', 'label': 'August 2004', 'raw': m['launch_date_display']}
    if m.get('launch_year'):
        pm['dates']['launch_date'] = {'value': str(m['launch_year']), 'precision': 'year', 'label': str(m['launch_year']), 'raw': str(m['launch_year'])}
    planetary['missions'].append(pm)
    add_source(m['official_source_url'], record=m['id'], checked=pc['as_of_date'])
    for k in ('status_source_url', 'current_position_source_url', 'recent_status_source_url', 'official_end_of_mission_source_url'):
        if m.get(k):
            add_source(m[k], record=m['id'], checked=pc['as_of_date'])
    base = {'destination': 'Planetary', 'equipment_ids': [], 'mission_id': m['id'], 'mission': m['mission_name'],
            'source_url': m['official_source_url'], 'source_scope': 'planetary card: official NASA mission page (mission-level, not per-field)'}
    for k, typ, t in (('launch_date', 'Launch', 'Launch'), ('arrival_date', 'Arrival / orbital insertion', 'Arrival at target'),
                      ('mission_end_date', 'Mission end / retirement / final shutdown', 'Mission end')):
        if pm['dates'].get(k) and pm['dates'][k]['value']:
            events.append({**base, 'id': f"evt_{m['id']}_{k}", 'date': pm['dates'][k], 'title': f"{m['mission_name']}: {t}", 'event_type': typ})
    for n, ms in enumerate(m.get('key_milestones', [])):
        events.append({**base, 'id': f"evt_{m['id']}_ms{n + 1}", 'date': date_obj(ms['date']),
                       'title': f"{m['mission_name']}: {ms['event']}", 'event_type': 'Major mission operation'})

events = [e for e in events if e['date'] and e['date']['value']]
events.sort(key=lambda e: (e['date']['value'], e['id']))

srcs = []
for s in sources.values():
    s['checked'] = sorted(s['checked'])
    srcs.append(s)
srcs.sort(key=lambda s: s['url'])

site = {'featured_ids': FEATURED, 'legend': [
    {'key': 'green', 'label': 'Successful', 'definition': 'The mission or hardware achieved its recorded goals and ended in a documented, completed way. This describes outcome only; it does not mean the hardware is operating now.'},
    {'key': 'yellow', 'label': 'Working', 'definition': 'NASA sources in the dataset describe the mission or hardware as active on the checked date. Re-check the source for the current state.'},
    {'key': 'red', 'label': 'Lost contact or stopped working', 'definition': 'Sources record that contact ended, operations stopped, power was exhausted or hardware was damaged. Loss of contact does not by itself prove the physical hardware has failed.'}]}


def dump(name, obj):
    with open(os.path.join(D, name), 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)


dump('equipment.json', equip)
dump('missions.json', missions)
dump('planetary.json', planetary)
dump('timeline.json', events)
dump('sources.json', srcs)
dump('site.json', site)
print(len(equip), 'equipment;', len(missions), 'missions;', len(planetary['missions']), 'planetary;', len(events), 'events;', len(srcs), 'sources')
