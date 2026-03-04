# Skill Authoring Guide

This document defines standards and best practices for writing Skills for OpenClaw, based on [Claude Skill Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices).

## Directory Structure

### Standard Skill Directory Structure

```
skills/
└── <skill-name>/
    ├── SKILL.md              # Main entry file (required, self-contained)
    ├── agents/               # Agent config examples (optional)
    │   └── examples/
    └── assets/               # Resource files (optional)
        └── images/
```

### Directory Descriptions

- **SKILL.md**: Main entry file containing YAML frontmatter and all necessary documentation (**must be a self-contained single file**)
- **agents/**: OpenClaw agent configuration examples
- **assets/**: Images, scripts, and other resource files

### ⚠️ Important: Single-File Principle

**SKILL.md must be a fully self-contained single file. Do not reference external files.**

❌ **Wrong approach**:
```markdown
For detailed workflows, see [references/WORKFLOWS.md](references/WORKFLOWS.md)
For complete API reference, see [references/API.md](references/API.md)
```

✅ **Correct approach**:
```markdown
## Common Workflows

### Workflow 1: Health Check
...(include complete content directly in SKILL.md)

## API Reference

### Command: rise sustain health-check
...(include complete content directly in SKILL.md)
```

**Reason**: External references may prevent OpenClaw from correctly parsing and activating the skill's natural language triggers.

## YAML Frontmatter Specification

### Required Fields

```yaml
---
name: skill-name
description: Skill description here
---
```

### Field Requirements

#### `name` Field
- **Max length**: 64 characters
- **Allowed characters**: lowercase letters, digits, hyphens
- **Forbidden content**: 
  - XML tags
  - Reserved words: "anthropic", "claude"
  - Uppercase letters, underscores, special characters

**Recommended naming patterns**:
```yaml
# ✅ Gerund form (recommended)
name: processing-pdfs
name: analyzing-spreadsheets
name: managing-databases

# ✅ Noun phrases
name: pdf-processing
name: spreadsheet-analysis

# ✅ Action-oriented
name: process-pdfs
name: analyze-spreadsheets

# ❌ Avoid
name: helper          # too vague
name: utils           # too generic
name: claude-tools    # contains reserved word
name: PDF_Processing  # contains uppercase and underscores
```

#### `description` Field
- **Max length**: 1024 characters
- **Must be non-empty**
- **Forbidden content**: XML tags
- **Must include**: 
  1. What the skill does
  2. When to use it

**Writing guidelines**:
```yaml
# ✅ Correct: third person, specific, includes trigger words
description: Extracts text and tables from PDF files, fills forms, and merges documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.

# ✅ Correct: includes functionality and use case
description: Self-sustaining AI agent operations on SupeRISE platform - monitor balance, forecast consumption, plan actions. Use when managing operational balance, model costs, or ensuring agent survival.

# ❌ Wrong: first person
description: I can help you process PDF files

# ❌ Wrong: second person
description: You can use this to process PDF files

# ❌ Wrong: too vague
description: Helps with documents

# ❌ Wrong: only functionality, no use case
description: Processes PDF files and extracts data
```

### Optional Fields (OpenClaw-Specific)

```yaml
user-invocable: true
disable-model-invocation: false
metadata: 
  openclaw:
    emoji: "🔋"
    requires:
      bins: ["rise"]
      env: ["MOCK"]
      config: []
    install: "bun install && bun run build && bun link"
```

## SKILL.md Content Specification

### Core Principles

1. **Brevity is king**: Keep SKILL.md body under 500 lines
2. **Progressive disclosure**: Put detailed content in references/, reference as needed
3. **Concrete examples**: Use specific code examples, avoid abstract descriptions
4. **Consistent terminology**: Use uniform terminology throughout

### Recommended Structure

```markdown
---
name: skill-name
description: Clear description with what and when
---

# Skill Title

Brief introduction (1-2 paragraphs)

## When to Use This Skill

- Clear use cases
- Keywords that trigger this skill

## Prerequisites

- Platform requirements
- Required tools/binaries
- Environment setup

## Quick Start

Simple examples to get started quickly

## Core Capabilities

High-level overview of main features

**Note**: All capability details should be included directly in SKILL.md, not in separate files.

## Common Workflows

3-5 most common usage patterns with code examples

**Note**: All workflows should be included directly in SKILL.md, not in separate files.

## Configuration

Basic configuration instructions

## Troubleshooting

Top 3-5 common issues and solutions

**Note**: All troubleshooting content should be included directly in SKILL.md, not in separate files.

## Command Reference

Quick command reference

## Best Practices

5-7 key best practices

## File Structure

Overview of skill directory structure

## Next Steps

Clear next actions for users
```

### Content Organization Patterns

**Pattern 1: Feature grouping (recommended)**

```markdown
## Advanced Features

### Form Filling
Complete guide on filling PDF forms...
(include complete content directly)

### API Reference
All available methods and parameters...
(include complete content directly)

### Examples
Common usage patterns...
(include complete content directly)
```

**Pattern 2: Domain-specific organization**

```markdown
## Available Datasets

### Finance
Revenue, ARR, and financial metrics...
(include complete content directly)

### Sales
Pipeline, accounts, and sales data...
(include complete content directly)

### Product
API usage and product metrics...
(include complete content directly)
```

### ⚠️ No External References

- ❌ **Forbidden**: `[references/XXX.md](references/XXX.md)`
- ❌ **Forbidden**: `See [DETAILS.md](references/DETAILS.md)`
- ✅ **Correct**: All content included directly in SKILL.md

### Anti-Patterns to Avoid

1. **Windows paths**: Use `/` not `\`
2. **Too many options**: Do not provide more than 5-7 options
3. **Time-sensitive information**: Avoid "latest version", "current", etc.
4. **Inconsistent terminology**: Use the same terms consistently (e.g. balance vs quota)

## OpenClaw-Specific Requirements

### 1. Platform Integration (Optional)

If the skill can integrate with OpenClaw but also run standalone, document both:

```markdown
## Prerequisites

### Platform Requirements
- **RISE CLI**: Compiled binary installed and available in PATH
  - Build with: `bun run build:bin`
  - Install with: `bun link`

### Verification
\```bash
rise --version
\```

### Optional: OpenClaw Integration
This skill works standalone or integrated with OpenClaw for automated monitoring.
- Standalone: Use CLI commands directly
- OpenClaw: Automatic cron jobs and MCP tools available
```

**Note**: Avoid requiring a specific platform or provider, as this limits the skill's applicability.

### 2. MCP Tool Documentation

If the skill provides MCP tools, include complete tool reference in SKILL.md:

```markdown
## MCP Tools

Sustain provides 9 MCP tools for autonomous operation:

### Balance & Health
- `sustain.balance.get_status` - Get current balance and health
- `sustain.balance.get_pricing` - Get model pricing info

### Forecasting
- `sustain.forecast.compute` - Predict time until balance depleted

### MCP Tool Routing Table

| User Intent | MCP Tool | Key Parameters |
|-------------|----------|----------------|
| "Check my balance" | `sustain.balance.get_status` | none |
| "When will I run out?" | `sustain.forecast.compute` | none |
...
```

Each tool should include:
- Tool name
- Functionality description
- Parameter description (if any)
- Use cases (shown via Routing Table)

### 3. Environment Variables

Clearly document environment variable requirements:

```markdown
## Configuration

### Environment Variables
\```bash
# Development mode
export MOCK=true

# Production mode
export MOCK=false
export API_BASE_URL=https://api.example.com
\```
```

### 4. Installation Instructions

Provide install command in metadata:

```yaml
metadata:
  openclaw:
    install: "bun install && bun run build && bun link"
```

Document installation steps:

```markdown
## Installation

\```bash
cd SupeRISECli
bun install
bun run build
bun link
\```
```

## Content Writing Guide

### Writing Descriptions

**Good descriptions**:
- Third person
- Specific functionality
- Clear trigger scenarios
- Include keywords

```yaml
description: Self-sustaining AI agent operations on SupeRISE platform - monitor balance, forecast consumption, plan actions, switch models, and maintain continuous availability. Use when managing operational balance, model costs, or ensuring agent survival on superise-market platform.
```

**Key elements**:
1. Feature list: monitor, forecast, plan, switch, maintain
2. Platform: SupeRISE platform, superise-market
3. Trigger scenarios: managing balance, model costs, agent survival
4. Keywords: balance, forecast, consumption, survival

### Writing Workflows

Use concrete code examples, not abstract descriptions:

```markdown
### Workflow: Health Check

\```javascript
// Run health check
const result = await mcp.call("sustain.supervision.tick", { execute: false });

if (result.health.status === "HEALTHY") {
  log(`✅ Balance: ${result.health.balance}`);
} else {
  alert(`⚠️ Status: ${result.health.status}`);
}
\```
```

### Troubleshooting

Provide specific problems, symptoms, and solutions:

```markdown
### Issue: Wrong Provider

**Symptom**: "Wrong platform! Sustain requires openrouter."

**Solution**:
\```bash
# Switch to openrouter
openclaw models set openrouter/llama3.2
\```
```

## Quality Checklist

### Core Quality

- [ ] Description is specific and includes keywords
- [ ] Description includes functionality and use cases
- [ ] SKILL.md body is under 500 lines
- [ ] Detailed content in separate files
- [ ] No time-sensitive information
- [ ] Consistent terminology
- [ ] Examples are concrete, not abstract
- [ ] File references are one level deep only
- [ ] Uses progressive disclosure
- [ ] Workflow steps are clear

### Code and Scripts

- [ ] Scripts solve problems rather than deferring to Claude
- [ ] Error handling is clear and helpful
- [ ] No "magic constants" (all values documented)
- [ ] Required packages listed and verified
- [ ] Scripts have clear documentation
- [ ] No Windows paths (use forward slashes)
- [ ] Critical operations have verification steps
- [ ] Includes feedback loops

### OpenClaw-Specific

- [ ] Platform requirements clearly stated
- [ ] Includes platform verification code
- [ ] MCP tools fully documented
- [ ] Environment variables clearly described
- [ ] Installation steps complete
- [ ] Troubleshooting guide included
- [ ] Workflow examples provided

### Testing

- [ ] At least 3 evaluation cases created
- [ ] Tested in real scenarios
- [ ] All reference links verified
- [ ] All code examples are runnable

## Example Skill Structures

### Simple Skill (Single File)

```
skills/simple-skill/
└── SKILL.md
```

Suitable for:
- Simple functionality
- Documentation under 500 lines
- No complex references needed

### Medium Skill (With References)

```
skills/medium-skill/
├── SKILL.md
└── references/
    ├── WORKFLOWS.md
    ├── API.md
    └── EXAMPLES.md
```

Suitable for:
- Moderate complexity
- Requires detailed documentation
- Multiple use cases

### Complex Skill (Full Structure)

```
skills/complex-skill/
├── SKILL.md
├── references/
│   ├── SUSTAIN.md
│   ├── CKB.md
│   ├── MCP_TOOLS.md
│   ├── WORKFLOWS.md
│   ├── ADVANCED.md
│   └── TROUBLESHOOTING.md
├── agents/
│   └── examples/
│       └── config.json
└── assets/
    └── diagrams/
```

Suitable for:
- Complex functionality
- Multiple subsystems
- Requires example configurations
- Has visualization needs

## Common Patterns

### Pattern 1: Template Pattern

Provide copy-paste templates:

```markdown
## Template

\```javascript
async function myWorkflow() {
  // Step 1: Initialize
  const config = await loadConfig();
  
  // Step 2: Execute
  const result = await execute(config);
  
  // Step 3: Verify
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result;
}
\```
```

### Pattern 2: Example Pattern

Provide multiple concrete examples:

```markdown
## Examples

### Example 1: Basic Usage
\```javascript
const result = await tool.call("basic");
\```

### Example 2: Advanced Usage
\```javascript
const result = await tool.call("advanced", { option: true });
\```
```

### Pattern 3: Conditional Workflow Pattern

Select different paths based on conditions:

```markdown
## Conditional Workflow

\```javascript
if (status === "CRITICAL") {
  await topUp();
} else if (status === "LOW") {
  await switchModel();
} else {
  await noop();
}
\```
```

## Best Practices Summary

1. **Brevity is king**: SKILL.md < 500 lines
2. **Progressive disclosure**: Detailed content in references/
3. **Concrete examples**: Real code, not abstract descriptions
4. **Consistent terminology**: Uniform terms throughout
5. **Third person**: Use third person in description
6. **Platform verification**: OpenClaw skills must verify platform
7. **Complete documentation**: MCP tools need full reference
8. **Clear structure**: Follow recommended directory structure
9. **Quality checks**: Use the checklist to verify
10. **Continuous iteration**: Improve based on usage feedback

## References

- [Claude Skill Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Claude Skills Overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- Project example: `skills/superise-cli/`
