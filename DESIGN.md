# Design direction

Purpose: a lecture comparison that lets students isolate infrastructure tools, inspect six scores, and trace them to the supplied slide or demo inventory.

Visual system: the eXtreme Automation (XA) design system, light theme only. Sticky white header with the colour XA logo (`site/assets/xa-logo.svg`), canvas background #f5f5f7, white cards with a #e9e9ef border and 14px radius, navy #3d496e headings, rose #d27079 accent (eyebrow, highlight, checked boxes, focus ring). Links use the XA info blue #0879ad and secondary text uses slate #535c73, because XA sky and muted are below 4.5:1 on white.

Chart palette: one XA colour and line pattern per tool in CSV order (amber, dark amber, green, navy, rose, dark sky, maroon, slate, muted, dark rose, dark green, sky). Kubernetes, Ansible and Terraform keep the slide's orange, ochre and green associations. Twelve brand hues cannot all be told apart by colour alone, so the line patterns, legend, point tooltips and the table carry identity too.

Typography: PT Sans for text and JetBrains Mono for scale labels and table values, loaded from Google Fonts. A compact hero and a large radar diagram lead; exact values use tabular numerals.

Layout: a filter card beside the diagram card, followed by an exact-value table. On phones, filters sit above the diagram and the table scrolls horizontally. Native checkboxes (restyled) support keyboard selection. A category filter separates infrastructure tools from supporting workflow tools and runtimes.

The radar is the visual focus. No summary rankings or overall scores. Blank source cells remain unscored, never zero. The supplied image's rankings are a lecture snapshot, not current independent benchmarks.
