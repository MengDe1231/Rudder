---
name: contribute
description: "Guide for contributing to Rudder documentation and marketplace. Covers adding spec templates, marketplace skills, documentation pages, and submitting PRs across both the Rudder main repo and docs repo. Use when someone wants to add a new spec template, add a new skill to the marketplace, add or update documentation pages, or submit a PR to this project."
---

# Contributing to Rudder

Contributions are split across two repos:

| What | Repo | Purpose |
|------|------|---------|
| Documentation pages | [MengDe1231/docs](https://github.com/MengDe1231/docs) | Mintlify doc site |
| Skills + Spec templates | [MengDe1231/Nexus](https://github.com/MengDe1231/Nexus) | `rudder/` directory (marketplace index + templates) |

## Docs Repo Structure

```
docs/
├── docs.json              # Navigation config (MUST update for new pages)
│
├── index.mdx              # English homepage
├── quickstart.mdx         # English quickstart
├── zh/index.mdx           # Chinese homepage
├── zh/quickstart.mdx      # Chinese quickstart
│
├── guides/                # English guide pages
├── zh/guides/             # Chinese guide pages
│
├── templates/             # English template pages
├── zh/templates/          # Chinese template pages
│
├── skills-market/         # English skill marketplace pages
├── zh/skills-market/      # Chinese skill marketplace pages
│
├── blog/                  # English tech blog
├── zh/blog/               # Chinese tech blog
│
├── changelog/             # English changelog
├── zh/changelog/          # Chinese changelog
│
├── contribute/            # English contribution guide
├── zh/contribute/         # Chinese contribution guide
│
├── showcase/              # English showcase
└── zh/showcase/           # Chinese showcase
```

## Nexus Repo Marketplace Structure

```
Nexus/
└── rudder/
    ├── index.json             # Template registry (lists all available templates)
    ├── specs/                 # Spec templates
    │   └── electron-fullstack/
    │       ├── README.md
    │       ├── frontend/
    │       ├── backend/
    │       ├── guides/
    │       └── shared/
    └── skills/                # Skills
        └── rudder-meta/
            ├── SKILL.md
            └── references/
```

## Understanding docs.json

The navigation uses a **language-based structure**:

```json
{
  "navigation": {
    "languages": [
      {
        "language": "en",
        "groups": [
          {
            "group": "Getting started",
            "pages": ["index", "quickstart"]
          },
          {
            "group": "Guides",
            "pages": ["guides/specs", "guides/tasks", ...]
          },
          {
            "group": "Resource Marketplace",
            "pages": [
              {
                "group": "Skills",
                "expanded": false,
                "pages": ["skills-market/index", "skills-market/rudder-meta"]
              },
              {
                "group": "Spec Templates",
                "expanded": false,
                "pages": ["templates/specs-index", "templates/specs-electron"]
              }
            ]
          }
        ]
      },
      {
        "language": "zh",
        "groups": [
          // Same structure with zh/ prefix
        ]
      }
    ]
  }
}
```

**Key points**:

- English pages: no prefix (e.g., `guides/specs`)
- Chinese pages: `zh/` prefix (e.g., `zh/guides/specs`)
- Nested groups supported (e.g., Skills inside Resource Marketplace)
- `expanded: false` keeps groups collapsed by default

## Contributing a Spec Template

Spec templates live in the **Nexus repo** at `rudder/specs/`.

### 1. Create template directory

```
Nexus/rudder/specs/your-template-name/
├── README.md              # Template overview (required)
├── frontend/              # Frontend guidelines
│   ├── index.md
│   └── ...
├── backend/               # Backend guidelines
│   ├── index.md
│   └── ...
├── guides/                # Thinking guides
│   └── ...
└── shared/                # Cross-cutting concerns (optional)
    └── ...
```

Structure varies by stack. Include directories relevant to your template.

### 2. Register in index.json

Add your template to `rudder/index.json` in the Nexus repo:

```json
{
  "id": "your-template-id",
  "type": "spec",
  "name": "Your Template Name",
  "description": "Brief description of the template",
  "path": "rudder/specs/your-template-name",
  "tags": ["relevant", "tags"]
}
```

### 3. Create documentation pages (both languages, in docs repo)

**English**: `templates/specs-your-template.mdx`
**Chinese**: `zh/templates/specs-your-template.mdx`

Use this frontmatter:

```yaml
---
title: 'Your Template Name'
description: 'Brief description'
---
```

### 4. Update navigation in docs.json

Find the `Spec Templates` nested group and add your page:

```json
{
  "group": "Spec Templates",
  "expanded": false,
  "pages": ["templates/specs-index", "templates/specs-electron", "templates/specs-your-template"]
}
```

Do the same for Chinese under `"language": "zh"`:

```json
{
  "group": "Spec Templates",
  "expanded": false,
  "pages": [
    "zh/templates/specs-index",
    "zh/templates/specs-electron",
    "zh/templates/specs-your-template"
  ]
}
```

### 5. Update the overview page

Add your template to the table in:

- `templates/specs-index.mdx`
- `zh/templates/specs-index.mdx`

## Contributing a Skill

Skills live in the **Nexus repo** at `rudder/skills/`.

### 1. Create skill directory

```
Nexus/rudder/skills/your-skill/
├── SKILL.md               # Skill definition (required)
└── references/            # Reference docs (optional)
```

See [Codex Skills documentation](https://code.Codex.com/docs/en/skills) for SKILL.md format.

### 2. Register in index.json

Add your skill to `rudder/index.json` in the Nexus repo:

```json
{
  "id": "your-skill-id",
  "type": "skill",
  "name": "Your Skill Name",
  "description": "Brief description",
  "path": "rudder/skills/your-skill",
  "tags": ["relevant", "tags"]
}
```

### 3. Create documentation pages (in docs repo)

**English**: `skills-market/your-skill.mdx`
**Chinese**: `zh/skills-market/your-skill.mdx`

### 4. Update navigation in docs.json

Find the `Skills` nested group and add your page to both languages.

### 5. Update the overview page

Add your skill to the table in:

- `skills-market/index.mdx`
- `zh/skills-market/index.mdx`

### Installation

Users install skills via:

```bash
npx skills add MengDe1231/Nexus/rudder -s your-skill
```

## Contributing a Showcase Project

### 1. Copy the template

```bash
cp showcase/template.mdx showcase/your-project.mdx
cp zh/showcase/template.mdx zh/showcase/your-project.mdx
```

### 2. Fill in project details

- Update `sidebarTitle` with your project name
- Add project description
- Replace GitHub OG image URL with your repo
- Describe how you used Rudder

### 3. Update navigation in docs.json

Find the `Showcase` / `项目展示` group and add your page:

```json
{
  "group": "Showcase",
  "expanded": false,
  "pages": ["showcase/index", "showcase/open-typeless", "showcase/your-project"]
}
```

Do the same for Chinese.

### 4. Add Card to overview page

Add a Card component to display your project:

**English** (`showcase/index.mdx`):

```mdx
<Card title="Project Name" icon="icon-name" href="/showcase/your-project">
  One-line description
</Card>
```

**Chinese** (`zh/showcase/index.mdx`):

```mdx
<Card title="项目名" icon="icon-name" href="/zh/showcase/your-project">
  一句话描述
</Card>
```

## Contributing Documentation

### Adding a new guide

1. Create the page in `guides/your-guide.mdx`
2. Create Chinese version in `zh/guides/your-guide.mdx`
3. Update `docs.json` - add to `Guides` group in both languages

### Adding a blog post

1. Create the page in `blog/your-post.mdx`
2. Create Chinese version in `zh/blog/your-post.mdx`
3. Update `docs.json` - add to `Tech Blog` group in both languages

### Updating existing pages

1. Find the file in the appropriate directory
2. Make your changes
3. Ensure both language versions stay in sync

## Bilingual Requirements

**All user-facing content must have both English and Chinese versions.**

| Content Type | English Path          | Chinese Path             |
| ------------ | --------------------- | ------------------------ |
| Homepage     | `index.mdx`           | `zh/index.mdx`           |
| Guides       | `guides/*.mdx`        | `zh/guides/*.mdx`        |
| Templates    | `templates/*.mdx`     | `zh/templates/*.mdx`     |
| Skills       | `skills-market/*.mdx` | `zh/skills-market/*.mdx` |
| Showcase     | `showcase/*.mdx`      | `zh/showcase/*.mdx`      |
| Blog         | `blog/*.mdx`          | `zh/blog/*.mdx`          |
| Changelog    | `changelog/*.mdx`     | `zh/changelog/*.mdx`     |

## Development Setup

```bash
# Install dependencies
pnpm install

# Start local dev server
pnpm dev

# Check markdown lint
pnpm lint:md

# Verify docs structure
pnpm verify

# Format files
pnpm format
```

**Pre-commit hooks**: The project uses husky with lint-staged. On commit:

- Markdown files are auto-linted and formatted
- `verify-docs.py` checks docs.json and frontmatter

## MDX Components

Mintlify supports MDX components. Common ones:

```mdx
<Card title="Title" icon="download" href="/path">
  Card content here
</Card>

<CardGroup cols={2}>
  <Card>...</Card>
  <Card>...</Card>
</CardGroup>

<Accordion title="Click to expand">Hidden content</Accordion>

<AccordionGroup>
  <Accordion>...</Accordion>
</AccordionGroup>
```

Inline HTML is allowed (MDX). See [Mintlify docs](https://mintlify.com/docs/components) for all components.

## Submitting a PR

**For documentation changes** (docs repo):

1. Fork: `https://github.com/MengDe1231/docs`
2. Clone: `git clone https://github.com/YOUR_USERNAME/docs.git`
3. Install: `pnpm install`
4. Branch: `git checkout -b feat/your-contribution`
5. Make changes following this guide
6. Test: `pnpm dev`
7. Commit with conventional message (e.g., `docs: add xxx template`)
8. Push and create PR

**For skills/spec templates** (Nexus repo):

1. Fork: `https://github.com/MengDe1231/Nexus`
2. Clone: `git clone https://github.com/YOUR_USERNAME/Nexus.git`
3. Add your skill/template under `rudder/`
4. Update `rudder/index.json`
5. Push and create PR

## Checklist Before PR

- [ ] Both EN and ZH versions created (for doc pages)
- [ ] `docs.json` updated for both languages (for doc pages)
- [ ] `rudder/index.json` updated (for skills/templates)
- [ ] Overview/index pages updated with new entries
- [ ] Local preview tested (`pnpm dev`)
- [ ] No broken links
- [ ] Code blocks have correct language tags
- [ ] Frontmatter includes title and description
- [ ] Images placed in `images/` directory (if any)
