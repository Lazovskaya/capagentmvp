# Validators

CI checks intended for this factory: every reference in `factory-data.json` resolves to a real
file, no orphaned skill/agent/connector/artifact/gate files exist outside the data model, and the
generated adapters haven't drifted from `factory-data.json`.

Run the repository validator with:

```bash
python3 validators/validate_factory.py
```

It checks model references, component files, orphaned files, connector JSON (including
TODO placeholders), and generated `factory-data.js`/`index.html` drift. Use
`--no-generated` when inspecting the source model before running `python3 build.py`.
