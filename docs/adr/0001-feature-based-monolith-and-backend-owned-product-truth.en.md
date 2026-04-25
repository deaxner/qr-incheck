# ADR 0001: Feature-Based Monolith with Backend-Owned Product Truth

- Status: Accepted
- Date: 2026-04-16

## Context

This repository is intentionally built as a compact demo assignment around a QR check-in and check-out product. The scope is small and time-boxed, but the implementation still needs to be credible:

- show a badge
- register a clocking event
- show history
- manage team status

The main tension in this assignment is not scale but credibility. A demo can work technically while still sending the wrong architectural signal, for example:

- a frontend that invents business data or reconstructs it locally
- a codebase organized only by technical layers, hiding feature ownership
- a premature microservice or event architecture for a problem that is still small and local

## Decision

We choose a feature-based monolith in which the backend is the source of truth for business rules and product data.

Concretely, this means:

- the repo remains split into a separate `frontend/` and `backend/`, but conceptually functions as a single application
- the backend groups code primarily by domain feature and only secondarily by technical role
- the frontend consumes backend contracts and focuses on presentation, interaction, and light view mapping
- product data with functional meaning, such as status, history, active session, and badge data, is not invented in the frontend

## Why This Choice

1. A monolith is faster and more honest here than early decomposition
2. A feature-based structure makes ownership visible
3. Backend-owned product truth avoids misleading demo logic
4. Vertical slice first, without cosmetic boundaries

## Alternatives Considered

### 1. Classic Technical Layers as the Main Structure

Not chosen because this demo needs to show intentional functional boundaries rather than framework-first organization.

### 2. Frontend-Built Read Models and Derived Product Data

Not chosen because it conflicts with the goal of showing honest product truth in a demo.

### 3. Microservices or Separate Services per Domain

Not chosen because the complexity is disproportionate to the current scope.

## Consequences

Positive:

- core flows remain easy to follow
- per-feature changes stay local
- the UI stays close to real backend data
- tests can focus on business behavior instead of frontend mimicry

Negative:

- the backend returns relatively rich responses, which makes endpoint contracts more important
- some read models still exist as arrays in application services and are not fully formalized
- entities and repositories are partly shared, so feature boundaries are not entirely hard yet
