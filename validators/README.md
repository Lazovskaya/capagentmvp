# Validators

CI / local checks that keep `factory-data.json` honest against the repo tree.

```bash
make validate
# or
python3 validators/validate.py
python3 validators/validate.py --strict-orphans
```

**Status:** Implemented (`validate.py`). Covers component path existence, activity files,
activity→skill references, `readySlice` resolution, and orphan skill warnings.
