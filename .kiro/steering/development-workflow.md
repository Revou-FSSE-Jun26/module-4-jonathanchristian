---
inclusion: always
---

# Development Workflow

Apply this order to every change request: **Design and Task Updates → Requirement Consistency → Specification Isolation**.

Spec locations:
- Working specs: `.kiro/specs/<feature>/` (`requirements.md`, `design.md`, `tasks.md`, `CHANGELOG.md`).
- Isolated, versioned specs: root `specs/` folder.

## 1. Design and Task Updates
- Reflect every requested change in the `design.md` and `tasks.md` of the affected spec.
- Update `requirements.md` too when behavior or scope changes.
- Do this automatically; do not wait for the user to ask.
- Follow the `change-management` steering for version increments and CHANGELOG entries.

## 2. Requirement Consistency
- After the change, check requirements, design, and tasks for contradictions or gaps: conflicting rules, orphaned tasks, requirements without design coverage.
- If any are found, stop and notify the user before continuing. Present options, a recommendation, and the reasoning behind it.
- Proceed to step 3 only when requirements are consistent.

## 3. Requirement Creation (New Specs)
1. Read the requirements of all existing specs first.
2. Flag any inconsistencies or overlaps with the new requirement.
3. Ask the user, with a recommendation on how to refine, before creating the requirement.
