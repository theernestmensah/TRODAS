---
name: Trodas Technologies project portal
description: A calm workspace for project status and delivery.
colors:
  ink: "#211b1b"
  muted: "#626775"
  green: "#0040c1"
  rail: "#101216"
  line: "#e4e8f0"
  canvas: "#f3f6fc"
  white: "#ffffff"
  focus: "#80a6ff"
  secondary-text: "#606674"
  progress-bg: "#eaf3ed"
  progress-text: "#42755a"
  risk-bg: "#faf0de"
  risk-text: "#815a1d"
  review-bg: "#eef0f9"
  review-text: "#575981"
  completed-bg: "#edf0ec"
  completed-text: "#697b66"
typography:
  headline:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "27px"
    fontWeight: 600
    letterSpacing: "-0.8px"
  title:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    letterSpacing: "-0.2px"
  body:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "14px"
  label:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "11px"
  metric:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "29px"
    fontWeight: 600
    letterSpacing: "-1px"
rounded:
  panel: "12px"
  control: "6px"
  navigation: "7px"
  badge: "4px"
  dialog: "14px"
spacing:
  desktop-gutter: "40px"
  compact-gutter: "25px"
  phone-gutter: "18px"
  panel-gap: "24px"
components:
  button-primary:
    backgroundColor: "{colors.green}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "11px 16px"
  panel:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.panel}"
  deadline-tile:
    backgroundColor: "#f2f4ee"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    width: "38px"
    height: "42px"
---

# Design System: Trodas Technologies project portal

## Overview

**Creative North Star: "Calm project workspace"**

Operate mode makes status and next actions easy to scan. A deep black navigation rail frames a light sage canvas; white panels organize the work without competing with it. The system is compact and restrained, using quiet borders, practical typography, and small semantic accents.

Deadline date tiles are the recurring signature: a compact day above an uppercase month beside a project milestone.

**Key Characteristics:**
- Black navigation and light sage workspace.
- Compact status tables and clear action hierarchy.
- Quiet panels with restrained depth.
- Deadline date tiles as a repeatable signature.

## Colors

Green anchors primary actions. Black provides navigation contrast; sage and white separate workspace and content. Ink carries main text, while muted supports descriptions. Secondary text supports deadline, activity, progress, and summary labels. The normative values above reflect the final CSS cascade.

Status colors are semantic: green for in progress, amber for at risk, lavender for in review, and subdued green-gray for completed. Always pair color with a written status.

**The Status Label Rule.** Keep a text label alongside every status color.

## Typography

Segoe UI with Arial and sans-serif fallbacks serves all product text. Page headlines use the headline role; panel headings use the title role. Compact labels, table metadata, and supporting text are predominantly 11px; project-name buttons are 12px. Metrics use the 29px role. Dialog headings use 21px and the wordmark uses 33px.

At phone widths, page headlines reduce to 23px and metrics to 26px. Keep the hierarchy compact and preserve readable project names.

## Layout

Desktop uses a fixed 238px navigation rail and a 78px top bar. Main content has 40px gutters, a 1600px maximum width, and a four-column summary strip. The main dashboard pairs a flexible portfolio with a 295px supporting column and a 24px gap.

At 1450px and wider, the supporting column grows to 330px and row spacing expands. At 1200px and below, the rail narrows to 210px, gutters become 25px, and the support column becomes 260px. At 1000px and below, the dashboard stacks while supporting panels sit side by side.

At 700px and below, navigation moves behind a toggle, the top bar becomes 62px, gutters become 18px, summaries use two columns, and supporting panels, resources, team cards, and form fields stack. The project table scrolls horizontally inside its own panel.

**The Contained Table Rule.** Preserve the table columns and keep horizontal scrolling inside the table panel.

## Elevation & Depth

Panels use white fill and thin borders instead of shadows. Elevation is reserved for overlays: dialogs use a broad shadow and a tinted, blurred backdrop; the open phone rail and transient toast have smaller shadows. Keep standard content surfaces flat.

## Shapes

Panels use gently curved 12px corners. Controls and date tiles use 6px corners, navigation rows 7px, status badges 4px, and dialogs 14px. Avatars and small status dots are circular. Progress is a narrow rounded track.

## Components

Primary buttons use green fill, white text, and compact padding. Secondary buttons use white fill and a pale border. Text actions remain visually light. Interactive controls use a visible green focus outline; disabled buttons reduce opacity. Buttons transition for 160ms; navigation and toast transitions use 200ms. Reduced-motion preferences disable transitions.

Search sits beside status filter tabs and wraps at compact widths. Tables combine project identity, text status, progress bar and percentage, lead avatar, and deadline. Keep this scan order consistent on related screens.

The deadline tile keeps its day prominent and month secondary beside project and milestone text. Panels use small, clear headings and simple dividers. Dialogs contain focused project forms or detail editing and fit within the viewport.

The client preview uses the same visual system with a read-only banner and fewer actions. Backend connection and authentication remain pending; demo browser behavior is not evidence of server permissions.

## Do's and Don'ts

- Do keep status labels visible beside semantic colors.
- Do reuse deadline date tiles for delivery milestones.
- Do keep tables scrollable within their panels on phones.
- Do retain visible keyboard focus and reduced-motion support.
- Don't add shadows to ordinary content panels.
- Don't turn supporting labels into competing headlines.
- Don't treat the preview role selector as authenticated access.

## Brand source
Colors and fonts inspected from https://trodas.net/ on October 7, 2026. Primary button color #0040c1, black headings, white surfaces, pale blue background. Inter for body and interface text; Inter Tight for headings and metrics. Fonts self-hosted in assets/fonts with font-display swap. The live website shows a FODGE template logo; the portal uses a Trodas Technologies text wordmark rather than that unrelated asset.
