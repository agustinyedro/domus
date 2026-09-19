---
target: src/pages/index.astro
total_score: 18
max_score: 28
na_heuristics: 7,10
p0_count: 0
p1_count: 1
p2_count: 4
timestamp: 2026-09-18T18-54-08Z
slug: src-pages-index-astro
---
## Design Specificity Verdict

**Semi-specific.** The warm earth-tone palette (beige/brown/olive) and the Suri/family story give DOMUS genuine emotional character. However, the structural pattern—hero, "our story," 4 category cards, pricing tiers, contact form, footer—is a textbook SaaS landing template. Swap the brand name, colors, and copy, and this could sell meal kits, pet supplies, or meditation apps. The SVG logo (a polyline roof) is generic enough to represent any home brand. The interaction model (scroll reveals, parallax, hover lifts) uses standard Framer/Motion patterns with no sensory language, no product photography, no tactile textures, and no olfactory cues—fatal for a brand selling *aromas* and *experiences*. The sector cards are structurally identical; nothing signals the multisensory, embodied nature of the product.

**Deterministic scan**: The Impeccable detector returned 0 findings on `src/pages/index.astro`—a clean scan. Browser visualization was available (live-server on port 8400) but overlay injection failed because the server does not expose Chrome DevTools Protocol targets. No console findings were captured.

---

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No loading states; cart shows only `alert('Próximamente')` at checkout with no recovery path; form submit shows brief visual feedback but no confirmation message or error state |
| 2 | Match Between System and Real World | 3 | Good use of Argentine Spanish ("sentí", "escribinos") but "sectores" is jargon; emoji代替 professional imagery; "Pack Básico/Premium/Deluxe" mirrors SaaS, not artisan home goods |
| 3 | User Control and Freedom | 2 | Cart quantity controls have no undo beyond the remove button; no way to go back from WhatsApp redirect; mobile menu closes on any link click with no confirmation |
| 4 | Consistency and Standards | 3 | Button styles are consistent; but `globals.css` and `BaseLayout.astro` duplicate all design tokens (exact same `:root` block appears twice); hero buttons use `onclick` while pack buttons use `data-*` attributes with no handler—different patterns for same interaction |
| 5 | Error Prevention | 1 | Contact form has no client-side validation beyond `required`; no confirmation before WhatsApp redirect; `alert()` on checkout is a dead end; no input format hints |
| 6 | Recognition Rather Than Recall | 3 | Nav active-state highlighting helps; scroll indicator provides orientation; but sector cards require recalling which product belongs to which sector; no breadcrumbs or visual trail |
| 7 | Flexibility and Efficiency of Use | n/a | Not applicable for Persuade mode (landing page) |
| 8 | Aesthetic and Minimalist Design | 3 | Clean layout, good whitespace; but 3 font families (Montserrat, Inter, Playfair Display) adds visual noise; sector section uses 4 different background gradients unnecessarily |
| 9 | Help Users Recognize, Diagnose, and Recover from Errors | 1 | Form validation errors are browser-default (no custom messages); checkout `alert()` gives no recovery; no 404 handling; WhatsApp number is hardcoded placeholder (`5491112345678`) |
| 10 | Help and Documentation | n/a | Not applicable for Persuade mode (landing page) |
| **Total** | | **18/28** | **Fair (64%)** |

**Note**: Heuristics 7 and 10 are n/a for Persuade mode; max score = 28.

---

## Cognitive Load Assessment

| Item | Score | Evidence |
|------|-------|----------|
| Single focus | ❌ | Four unrelated sectors (aromas, food, clothing, yoga) compete for attention with no clear primary conversion path |
| Chunking | ✅ | Content is well-sectioned (hero, story, sectors, packs, contact) |
| Grouping | ✅ | Sector cards group products logically; pack tiers are clearly grouped |
| Visual hierarchy | ⚠️ | Hero h1 is strong; but "Nuestra historia" section is ~400 words with no visual break—blocks scanning |
| One thing at a time | ❌ | Landing page tries to be simultaneously: brand story, product catalog, subscription service, yoga studio, pizzeria, and clothing shop |
| Minimal choices | ❌ | 4 sectors × ~3 products each + 3 pack tiers + contact form = 20+ decision points on a single page |
| Working memory | ⚠️ | Pack features are listed but not compared side-by-side; user must mentally hold 3 tiers |
| Progressive disclosure | ⚠️ | Sectors show products but clicking "Explorar" goes to `/aromas` etc.—unclear if those pages exist; no intermediate step |

**Cognitive Load Score**: 3.5/8 — Significant cognitive overload from topic multiplicity.

---

## Emotional Journey

**Peak-End Rule:**
- **Peak**: The History section's Suri story is genuinely moving and emotionally unique—this is the brand's strongest asset
- **End**: The page ends with a generic footer ("Hecho con amor desde Argentina 🧡"). The last interactive moment is the contact form or WhatsApp float—functional but emotionally flat

**Emotional Valleys:**
1. After the moving Suri story, the transition to "Nuestros sectores" with emoji icons (🌿🍕👕🧘‍♀️) is jarring—the emotional register drops from profound to generic marketplace
2. The pack pricing section feels corporate (scaling tiers, "Más popular" badge) compared to the warmth of the brand story
3. The cart sidebar with `alert('Próximamente disponible')` is a dead-end that breaks trust at the highest-stakes moment

**Reassurance at High-Stakes Moments:**
- No social proof (testimonials, review counts, customer photos)
- No "why trust us" beyond the story
- No guarantee/return policy mention
- Prices shown without context (is $2,500/mes good value?)
- WhatsApp promise ("respondemos en menos de 24 horas") is the only trust signal

---

## What's Working

1. **The Suri/family origin story** is DOMUS's true differentiator. No competitor can copy this. The highlight box with Suri's medical journey creates authentic emotional investment that generic "artisanal brand" stories cannot match.

2. **Color system and typography** are coherent and warm. The olive accent against beige/brown creates a natural, earthy feel that aligns with the product domain. The Playfair Display italic for the subtitle adds sophistication.

3. **WhatsApp-first contact model** is culturally appropriate for Argentine market and lowers the conversion barrier. The floating button + form-to-WhatsApp pipeline is well-considered for the audience.

---

## Priority Issues

### [P1] Checkout is a dead end
- **What**: The "Finalizar compra" button triggers `alert('Próximamente disponible')`. Users who built up intent to purchase hit a wall with no recovery path, no email capture, no waitlist, no alternative.
- **Why it matters**: Every user who clicks this button is a qualified lead being discarded. In Persuade mode, the final conversion action must work or gracefully redirect.
- **Fix**: Replace with a pre-order/waitlist form, or redirect to WhatsApp with a pre-filled purchase intent message, or disable the button with an honest "Coming soon" state.
- **Suggested command**: `/impeccable harden` — redesign the cart checkout flow with a proper CTA alternative.

### [P2] Sector ambiguity kills conversion clarity
- **What**: Four equal-weight sectors (aromas, food, clothing, yoga) with no visual hierarchy between them. A visitor cannot tell: "Is this a candle brand? A pizza delivery? A yoga studio?"
- **Why it matters**: Cognitive overload from "one thing at a time" failure. Users scanning quickly will not parse 4 equal cards.
- **Fix**: Lead with the primary category (likely aromas/home), use the other 3 as secondary "also from Domus" links. Or add a guiding question: "What brings you here today?"
- **Suggested command**: `/impeccable distill` — redesign SectorsSection to establish clear category hierarchy.

### [P3] No product imagery
- **What**: Zero photographs of actual products. Sectors list text descriptions ("Sahumerio de sándalo", "Pack 5 pizzas variadas") with no visual.
- **Why it matters**: Purchase decisions for physical products require visual confirmation. Text-only product listings feel incomplete and low-effort.
- **Fix**: Add at least one hero product photo per sector card, or a lifestyle photography hero image. Even placeholder images would dramatically improve perceived value.
- **Suggested command**: `/impeccable bolder` — add product photography placeholders and redesign sector cards with visual emphasis.

### [P4] Duplicate CSS design tokens
- **What**: `globals.css` and `BaseLayout.astro` both define the exact same `:root` block (lines 38-73 in BaseLayout, lines 3-38 in globals.css).
- **Why it matters**: Future changes to tokens require editing two files; one will silently win. This is a code quality issue that will compound.
- **Fix**: Remove the `:root` block from `BaseLayout.astro` and import `globals.css` instead, or consolidate into a single source.
- **Suggested command**: `/impeccable audit` — consolidate CSS token definitions.

### [P5] Hardcoded placeholder WhatsApp number
- **What**: `5491112345678` is used in 3 places (Navbar, WhatsAppContact, Footer). If this goes live, every contact button opens a dead chat.
- **Why it matters**: The entire contact strategy depends on WhatsApp. A broken number makes the primary conversion channel non-functional.
- **Fix**: Centralize the phone number into a config/constant, verify it works before deploy.
- **Suggested command**: `/impeccable harden` — extract WhatsApp number to a shared config.

---

## Persona Red Flags

### Jordan (First-Timer)
- First impression is "What does DOMUS actually sell?" The hero says "aromas, momentos y sensaciones" but the sectors show food, clothing, and yoga. Jordan leaves confused about what they're supposed to buy.
- The "Nuestra historia" section is 400+ words before any product is shown. First-timers need product clarity *before* emotional investment.

### Casey (Mobile User)
- The WhatsApp floating button (60px) and the cart notification toast both occupy the bottom-right zone on mobile—potential overlap/tap conflict.
- Mobile menu links are 1.5rem text but the WhatsApp link in the menu uses a green rounded button with no indication it opens an external app. Casey may tap it accidentally.
- The form's select dropdown for "¿Qué te interesa?" requires scrolling through 9 options with no visual grouping (packs are mixed with sectors).

### Riley (Stress Tester)
- Adding items to cart, then clicking "Finalizar compra" → `alert('Próximamente disponible')` → dismiss → the cart sidebar remains open with the items still there. Riley has no way to know if their "order" was captured or not.
- The form submits to WhatsApp via `window.open()` which may be blocked by popup blockers. No fallback is provided.
- Social media links in the footer (`https://instagram.com`, `https://tiktok.com`) are generic homepages, not DOMUS's actual profiles.

---

## Minor Observations

- The `@import '../styles/animations.css'` inside `<style is:global>` in `index.astro` may cause FOUC (Flash of Unstyled Content) since CSS imports block rendering.
- `bounceSubtle` keyframe is referenced in `HeroSection.astro:164` but never defined in `animations.css`—likely a silent CSS error.
- Pack card "Comenzar" buttons have `data-pack` and `data-price` attributes but no click handler attached—they do nothing.
- The `globals.css` file is imported nowhere visible; it appears to be a duplicate of the BaseLayout styles. Dead file.
- Footer social links link to `https://instagram.com` and `https://tiktok.com` (generic homepages) rather than actual DOMUS profiles.
- The hero's `scrollIntoView` is done via inline `onclick` with different syntax than the JS-based smooth scroll in `animations.js`—redundant and inconsistent.

---

## Questions to Consider

1. If DOMUS sells 4 unrelated categories, is the landing page the right format? Would separate category landing pages with a simpler "choose your path" homepage convert better?
2. The Suri story is the emotional engine of this brand—why is it buried below the fold instead of being the hero?
3. What would this page feel like if it *smelled*? Could the design evoke scent through texture, particle effects, or ambient imagery instead of flat gradients?
4. Is the subscription model (packs) the primary revenue driver, or are individual sector purchases? The page treats them equally, but they have fundamentally different user intents.
5. The WhatsApp number appears 4 times across the page—is DOMUS a WhatsApp-first business? If so, should the entire page be redesigned around that single channel instead of pretending to be a full e-commerce experience?
