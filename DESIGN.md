# Ratatoskr Web — Design

> Status: Accepted
> Last reviewed: 2026-08-19
> Related: [ADR-0002](docs/adr/0002-shadcn-base-ui.md), [ADR-0003](docs/adr/0003-icons.md),
> [ADR-0004](docs/adr/0004-design-libraries.md)

> Clinical blueprint on frosted paper.

**Theme:** light is canonical. Dark exists and is not yet designed — see [Dark](#dark).

The interface is almost entirely achromatic: a pure white paper layer on a soft warm-grey canvas,
large-radius containers floating on hairline borders, black text, grey secondary tones. One red is
reserved for destructive states and appears nowhere else. Geist's geometric neutrality carries every
size, with tracking tightening as type grows. The result reads as developer infrastructure rather
than consumer product, which is what this is: a tool one person runs on one machine to read their own
archive.

This document is the authority on what the client looks like. `AGENTS.md` remains the authority on
how it behaves, and where the two disagree, `AGENTS.md` wins — every deviation below exists because
of that rule.

## Tokens live in code, not here

`src/index.css` is the implementation. Every value in this document is a token there, mapped onto the
names shadcn generates against, so a component installed by `shadcn add` inherits this identity
without being told about it.

That mapping is the reason there is no parallel token system to keep in step: `--background`,
`--card`, `--foreground`, `--primary`, `--muted-foreground`, `--border`, `--ring`, `--destructive`
and `--radius` are shadcn's names carrying our values.

## Colours

| Name | Value | Token | Role |
|---|---|---|---|
| Canvas | `#f5f5f5` | `--background` | Page background, muted fills, secondary buttons |
| Paper | `#ffffff` | `--card`, `--popover` | Card surfaces, popovers |
| Surface alt | `#fafafa` | `--sidebar` | Navigation surface, one step off the canvas |
| Ink | `#0a0a0a` | `--foreground`, `--primary` | Body text, headings, filled button ground |
| Ink soft | `#fafafa` | `--primary-foreground` | Text on the filled button |
| Mid grey | `#707070` | `--muted-foreground` | Muted body text, placeholders, helper labels |
| Hairline | `#e5e5e5` | `--border`, `--input` | Borders, card edges, badge outlines |
| Ember | `#e7000b` | `--destructive` | Destructive states only |

### Surfaces

| Level | Name | Value | Purpose |
|---|---|---|---|
| 0 | Canvas | `#f5f5f5` | The page. Broadest layer |
| 1 | Sidebar | `#fafafa` | Navigation, one tonal step lighter |
| 2 | Paper | `#ffffff` | Content containers. Brightest surface |

Three tones create layering without dividers. A card does not need a rule above it; it needs to be a
different tone from what it sits on.

### Ember is destructive, and nothing else

The source reference contradicted itself here — its colour table called Ember "a red decorative
accent… use as a supporting accent, not as a status color", while its component notes, its Do's list
and its philosophy section all said the opposite: destructive only, "it never decorates". Three
against one, and the three agree with this repository's own rules, so **Ember is destructive-only**.

That is not pedantry about a contradiction. A hue that appears both as decoration and as "this
deletes something" teaches a user to ignore it in the place where ignoring it is expensive.

Destructive **text** sits on paper or the sidebar, where `#e7000b` measures 4.77:1 and 4.60:1. On the
canvas it is 4.38:1 and fails AA — put the control in a card, or use ink and let the wording carry
the warning.

## Typography

**Geist**, self-hosted through `@fontsource-variable/geist`. No Google Fonts link, no CDN — a
self-hosted deployment that calls out to a font host is a data leak, and `SECURITY.md` forbids it.
Substitute: Inter. Weights: 400, 500, 600. OpenType: `"ss01" on, "cv11" on`.

| Role | Size | Line height | Tracking | Utility |
|---|---|---|---|---|
| caption | 12px | 1.33 | +0.6px | `text-caption` |
| body | 14px | 1.43 | — | `text-body` |
| body-lg | 16px | 1.50 | — | `text-body-lg` |
| subheading | 18px | 1.56 | — | `text-subheading` |
| heading-sm | 24px | 1.33 | −0.6px | `text-heading-sm` |
| heading | 30px | 1.20 | −0.75px | `text-heading` |
| heading-lg | 36px | 1.11 | −0.9px | `text-heading-lg` |
| display | 48px | 1.10 | −2.4px | `text-display` |

Tracking tightens aggressively as size grows — −0.05em at display — and loosens on small uppercase
labels at +0.05em. Nothing goes outside that range; wider or tighter breaks the system.

### The reader is the exception

`body` at 14px/1.43 is a dense-UI scale, and it is right for search results, catalogues, operations
and settings. It is wrong for the surface this client exists for.

**The reader view uses `body-lg` — 16px/1.5 — as its minimum, with the measure capped near 70
characters.** This is the one place the single density scale is deliberately broken, and it is broken
because a client whose primary job is reading long-form text cannot set that text at the size it uses
for table rows.

Everywhere else, one scale. The exception is the reader, and it stops there.

## Shape

**Two radii, and nothing between them.**

| Class | Value | Applies to |
|---|---|---|
| `rounded-lg` | 18px | Buttons, inputs, badges — pill geometry at ~36px height |
| `rounded-xl` | 24px | Cards and containers |

`--radius` is 1.125rem, so shadcn's derived `rounded-lg` lands on 18px on its own. `--radius-xl` is
pinned to 1.5rem rather than derived, because the multiplicative scale would put it at 25.2px and the
system has exactly two values.

Square corners appear nowhere.

## Spacing and layout

Base unit 4px. Scale: 4, 8, 12, 16, 20, 24, 48. Density: compact.

- Page max width: 1280px
- Section gap: 48px, up to 80px between major bands
- Card padding: 20px
- Element gap: 8px

## Elevation

```
card:  0 0 0 1px rgb(23 23 23 / 0.05), 0 1px 3px rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)
```

Available as `--shadow-subtle`. A 1px hairline stacked with two faint layers: cards read as raised
without drama. Filled buttons carry no shadow at all and rely on tonal contrast.

## Components

**Filled button** — `#0a0a0a` ground, `#fafafa` text, no border, `rounded-lg`, 14px/500, height
36–40px. The dark-on-light inversion is the only chromatic interaction in the system.

**Ghost button** — `#f5f5f5` ground, ink text, no border, same shape and type as filled. A tonal
sibling, not a muted alternative.

**Outline button** — transparent, ink text, 1px hairline border. Preferred inside a card or beside
filled controls.

**Card** — paper ground, `rounded-xl`, 1px hairline border, `--shadow-subtle`, 20px padding. The
border is not optional: the shadow alone does not define the edge.

**Input** — `#f5f5f5` fill, no border at rest, ink text, mid-grey placeholder, `rounded-lg`,
8px 10px padding, 14px/400. Focus adds a visible ink ring — see [Deviations](#deviations).

**Badge** — `rounded-lg` capsule, 2px 8px, 12px/500. Solid (`#171717` on `#fafafa`), soft (`#f5f5f5`
on ink), or outline.

**Breadcrumb** — purely typographic. 14px/400, mid-grey separators, ink current segment. No
background, no border.

**Stat block** — caption label uppercase mid-grey, value at 30–48px/600 ink with tight tracking. No
card chrome; the type scale alone establishes the metric.

**Search trigger** — input-shaped, mid-grey text, keyboard shortcut right-aligned. Reads as both a
button and a field.

## Do

- Use ink on paper for filled buttons. It is the only primary action treatment.
- Keep `rounded-lg` on everything interactive and `rounded-xl` on containers.
- Set display at 48px/600 with −0.05em tracking.
- Reserve Ember for destructive states.
- Use the three-tone surface stack for layering instead of dividers.
- Give every interactive control a visible focus ring.

## Don't

- Do not introduce a brand hue. The absence of colour is the system.
- Do not use a radius other than the two, and never a square corner.
- Do not drop the hairline border on a card.
- Do not set body text below 14px, or muted text lighter than `#707070`.
- Do not use gradients, coloured shadows, or accent fills.
- Do not track wider than +0.05em or tighter than −0.05em.
- Do not carry meaning in Ember alone — a destructive action says so in words too.

## Imagery

There is almost none, and that is deliberate. No hero photography, no illustration, no decorative
graphics — this client renders someone's archive, and the archive is the content. Icons are
thin-stroke geometric marks at 1.5–2px in ink or mid-grey, used as functional cues. Animated icons
follow ADR-0003 and are decoration on top of something that already works.

## Deviations

Every difference from the source reference, and why. Each was measured, not preferred.

**Mid grey is `#707070`, not `#737373`.** `#737373` on the `#f5f5f5` canvas is 4.35:1 — under WCAG AA
for body text — and muted text on the page background is precisely where that colour lands. `#707070`
measures 4.54 on canvas, 4.95 on paper and 4.74 on sidebar. The change is three hex steps and
invisible; the failure it removes is not.

**The focus ring is ink, not hairline.** The reference specifies a `#e5e5e5` ring on input focus.
That is 1.26:1 on paper — invisible. `AGENTS.md` requires visible focus and WCAG 2.4.7 agrees, so the
ring is `#0a0a0a` at 19.8:1. This is the clearest case of `AGENTS.md` winning a disagreement.

**Ember is destructive-only**, resolving the reference's internal contradiction. See above.

**The filled button is `#0a0a0a`.** The reference's quick-reference line said `#171717`; its component
spec, its Do's list and its prompt examples all said `#0a0a0a`. Three against one again.

**`--shadow-subtle-2` was dropped.** Its value — `lab(2.75381 0 0) 0px 0px 0px 0px` — is a shadow
with no offset, no blur and no spread. It renders nothing. A token that does nothing is a token
someone will spend an afternoon trying to see.

**`--section-gap: 48-80px` was split.** That is not a CSS value. It is written here as a range in
prose and left out of the token set.

**Radius `xl` is pinned, not derived.** See [Shape](#shape).

## Known gaps

**Dark.** The reference specifies a light theme only. `src/index.css` still carries shadcn's
generated dark palette, which is coherent but is not derived from this document and has not been
checked against it. Both themes work today and both are keyboard- and contrast-tested; dark is simply
not *designed* yet. Deriving it is the next design task, and it is a task, not a variable swap: the
three-tone surface stack and the single-inversion filled button both have to be re-decided against a
dark ground.

**Charts.** The reference gives no data-visualisation palette. `--chart-1` through `--chart-5` are
greys, which is honest for an achromatic system and will not survive the first chart with five
series. Decide it when a view needs one, and decide it against the no-meaning-in-colour-alone rule.

**Card borders and WCAG 1.4.11.** The hairline is 1.26:1 against paper. The card is also separated by
tone and shadow, so its boundary is never the only indicator of anything — but if a future view makes
a border load-bearing, that border needs 3:1 and this one does not have it.
