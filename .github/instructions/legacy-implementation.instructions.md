---
applyTo: "README.md,doc/**,SupeRISECli/**,SupeRISELocalServer/**"
---

# Legacy implementation instructions

- These paths belong to the pre-refactor implementation and should be treated as migration reference material.
- Use them to extract existing capabilities, edge cases, and operational assumptions.
- Do not extend the `.NET signer + Bun CLI` split unless the task explicitly asks for legacy maintenance.
- If behavior parity matters, map that behavior into the target Node.js architecture defined in `docs/refactor`.
- Once a legacy responsibility has been re-homed into the target architecture, deleting the superseded legacy files in these paths is allowed.
- If you must patch a legacy path before the refactor lands, keep the change isolated and avoid creating new long-lived dependencies on the legacy structure.
