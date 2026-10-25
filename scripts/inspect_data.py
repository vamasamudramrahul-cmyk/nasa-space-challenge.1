import csv
import json

csv_path = r"c:\Users\Rahul\Downloads\Abandoned_But_Not_Forgotten_Claude_Handoff\Abandoned_But_Not_Forgotten_Claude_Handoff\04_equipment_catalogue_seed_DO_NOT_PUBLISH_YET.csv"

with open(csv_path, mode="r", encoding="utf-8-sig") as f:
    records = list(csv.DictReader(f))

missions = set()
all_events = []

for r in records:
    missions.add(r['mission_name'])
    hist_raw = r.get('mission_history', '').strip()
    if hist_raw:
        try:
            events = json.loads(hist_raw)
            for ev in events:
                all_events.append({
                    'equipment_id': r['id'],
                    'equipment_name': r['equipment_name'],
                    'mission_name': r['mission_name'],
                    'destination': 'Moon' if 'Moon' in r['destination'] else 'Mars',
                    'date': ev.get('date'),
                    'event': ev.get('event'),
                    'source_url': ev.get('source_url', r.get('source_url', ''))
                })
        except Exception as e:
            print(f"Error parsing history for {r['id']}: {e}")

print(f"Unique missions ({len(missions)}):", sorted(list(missions)))
print(f"Total extracted timeline events: {len(all_events)}")
for ev in all_events[:10]:
    print(f"  [{ev['destination']}] {ev['date']}: {ev['event']} ({ev['equipment_name']})")
