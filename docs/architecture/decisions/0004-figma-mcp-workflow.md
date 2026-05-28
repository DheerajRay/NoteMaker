# ADR 0004: Figma MCP Design Workflow

## Decision

Use Figma MCP for design artifacts and FigJam diagrams, with Code Connect added after React components stabilize.

## Rationale

Figma is better suited than ad hoc browser mockups for durable design tokens, component states, and handoff. Code Connect should map stable components, not early churn.

## Consequences

The current codebase includes documentation for the design direction. Figma file creation depends on authenticated Figma plan/project context in the MCP environment.
