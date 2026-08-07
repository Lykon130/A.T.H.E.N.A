---
name: book-appointment
department: concierge
stage: human-led
description: Use when the user wants to book or schedule something — a restaurant, appointment, service call, travel — from research through to confirmation.
---

1. Clarify what's being booked and the constraints (date range, location, party size, budget). Check `vault/wiki/profile.md` first for known preferences so the user isn't re-asked.
2. Research available options and present a shortlist for the user to pick from.
3. Draft the booking (who/what/when/where/price if applicable) for review.
4. **Submitting the actual booking always needs the user's explicit go-ahead in the moment** — this skill never submits a form, makes a payment, or confirms a reservation on its own initiative, no matter how many times it's been approved before. Each booking gets its own confirmation.
5. Never enter payment details, IDs, or passwords as part of this flow — if the booking site needs those, the user enters them, or a password-manager integration handles it directly.
6. Once confirmed, log it to `vault/outputs/booking-{name}-{date}.md` and link it from `calendar`.
