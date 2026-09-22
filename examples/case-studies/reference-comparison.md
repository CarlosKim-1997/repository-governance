# Reference checker comparison

The read-only reference source was fetched from its `main` branch at `b865765847a0cabb9f62bc1ab0115d5fad196bb7`. The reference checker was copied without edits to `examples/case-studies/reference-g1-checker.mjs`; its original source was `tooling/governance-check.mjs`, with tests in `tests/unit/governance-check.test.ts`. The original checker reports PASS on its current repository snapshot.

The standalone checker has intentional v1 contract differences on that unmodified snapshot:

| Finding | Classification | Reason |
| --- | --- | --- |
| Missing installed `tooling/governance/check.mjs` and `version.json` | Intentional generalization | The new distribution requires a vendored offline artifact and tooling metadata. |
| Decision `implements` points to a Hard Constraint | Intentional semantic tightening | The supplied v1 target matrix allows Decision `implements` → Decision only. A future project-authority review may normalize this as `depends_on: [C-003]`; deleting it is not a mechanical migration. |
| Open Question `resolved_by` is a YAML list | Intentional semantic tightening | v1 requires one scalar Decision ID. |
| Current State combines `global` with local areas | Intentional semantic tightening | v1 makes `global` exclusive per object. |

The reference checker also accepts an Evidence-shaped `E-*` relation if unresolved; the standalone checker rejects it because v1 has no Evidence schema. The reference checker lacks the complete typed target matrix and cycle checks; those are intentional new validations. The unmodified reference data therefore fails the new checker with five findings. `validate-reference.mjs` copies the source into a disposable temporary directory, changes the relation to the review hypothesis `depends_on: [C-003]`, normalizes OQ and State metadata, adds the new tooling artifacts, and then checks the result. This is not an authorized migration of the original repository. No unexplained difference was observed in the original five findings; full semantic parity is not asserted.

After the targeted correction pass, the unchanged reference checker still reports PASS; the standalone checker reports the same five known findings and no new ones. The disposable compatibility experiment still reports PASS.
