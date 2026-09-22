# Release procedure and gate

Distribution 0.1.0 remains development. Before a stable 1.0.0 release, freeze the Core and five schemas; verify exact template copies; bundle the offline checker; pass generic checker and installer fixtures; prove Greenfield and Brownfield safety, partial recovery, idempotency, clean-room non-JavaScript installation, reference regression, and an unrelated non-web repository case. Scan reusable files for project-specific leakage. Generate a distribution manifest and SHA-256 checksums, verify them, and complete a read-only final audit.

The intended release is a versioned archive, manifest, and checksums. Building them locally does not authorize publication. The checker validates structure only; semantic adoption and release readiness require human review.
