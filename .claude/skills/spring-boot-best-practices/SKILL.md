---
name: spring-boot-best-practices
description: Scaffolds a new Spring Boot project (Java 25, latest stable Spring Boot, Maven) with a clean controller/service/repository/model layered architecture, or adds a new entity slice (model + repository + service + controller + DTO + mapper) to an existing Spring Boot project. Use whenever the user asks to create a Spring Boot REST API, a Spring Web monolith with server-rendered views, or asks to create/add/modify an entity, repository, service, or controller in a Spring project — even if they just say "necesito un endpoint para X" or "agrega un CRUD de X" without naming Spring Boot explicitly, as long as the project is (or is clearly meant to be) a Spring Boot app.
metadata:
  author: andres
  version: "1.0.0"
---

# Spring Boot Best Practices

Generates Spring Boot projects and Spring Boot code that follow one consistent layered
architecture, so every project this skill touches looks and behaves the same way regardless
of which entity or feature is being built.

## Two situations this skill handles

1. **New project** — the workspace is empty or has no Spring Boot project yet. Scaffold a
   full project via Spring Initializr, then lay out the base packages.
2. **Existing project** — a Spring Boot project already exists. Don't re-scaffold; detect its
   base package and conventions, then add the new model/repository/service/controller/DTO/mapper
   following the same pattern already documented in `references/layered-architecture.md`.

Read `references/layered-architecture.md` before writing any entity, DTO, mapper, repository,
service, or controller — it has the conventions and full code examples this skill is built
around. Don't improvise a different structure; the value of this skill is that every entity
slice it produces looks identical.

## Step 1 — New project? Scaffold with Spring Initializr

Don't hand-write `pom.xml` or the Maven Wrapper — Spring Initializr generates both correctly
for whatever Boot/Java version you ask it for, and its dependency artifact ids change between
Boot major versions (Boot 4, for example, renamed `spring-boot-starter-web` to
`spring-boot-starter-webmvc`). Hand-writing the POM risks it being subtly wrong or stale.

Full instructions, the exact `curl` command, how to resolve "latest stable Boot ≥ 4.0.6", and
what to do if `javaVersion=25` isn't offered are in `references/project-setup.md` — read it now
if you're scaffolding a new project. In short:

1. Query `https://start.spring.io/metadata/client` to resolve the artifactId (same name as the
   workspace directory), the current default stable `bootVersion` (never a `.BUILD-SNAPSHOT` or
   `.M*`), and confirm `javaVersion=25` is a valid option.
2. Ask the user (if not already obvious from the request) whether this is a **REST API only**
   or a **Spring Web monolith with server-rendered views** — the dependency set and follow-up
   steps differ (the monolith adds `thymeleaf` and needs the layout in Step 3).
3. Run the documented `curl .../starter.zip` request with:
   `groupId=com.andres.course.claude.springboot`, `artifactId=<workspace-dir-name>`,
   `packageName=com.andres.course.claude.springboot.<artifactId>.app`, `packaging=jar`,
   `javaVersion=25` (or the resolved fallback), and
   `dependencies=web,validation,data-jpa,h2,devtools,actuator` (+ `thymeleaf` for a monolith).
   Extract it straight into the project root — don't nest it in an extra subfolder.
4. Confirm `mvnw` and `mvnw.cmd` landed in the project root and `.mvn/wrapper/` exists, and that
   `mvnw` is executable (Initializr's zip already sets the bit, but verify — Windows checkouts
   sometimes lose it).

## Step 2 — Lay out (or extend) the packages

Under the generated base package (`.../app`), create these packages if they don't exist yet:

```
models/        JPA entities (@Entity)
dtos/          Request/response records (see conventions below)
mappers/       Explicit entity <-> DTO conversion
repositories/  interface X extends JpaRepository<Entity, Id>
services/      business logic, orchestrates repositories + mappers
controllers/   @RestController — HTTP only, no business logic
```

For every entity the user asks for, create one file in each of the five non-model-adjacent
packages (model, dto, mapper, repository, service, controller) following
`references/layered-architecture.md` exactly — it has full working examples for each layer,
not just a description, so read it rather than reconstructing the pattern from memory.

**DTOs are `record`s, not classes.** One DTO per entity is used for both requests and
responses (per this project's convention — don't create separate `CreateXRequest` /
`XResponse` types unless the user explicitly asks for that split later). Never put
`password`, `createdAt`/`created_at`, or `updatedAt`/`updated_at` (or similarly
sensitive/internal fields) in the DTO — those stay in the entity only.

**Mappers are explicit, not MapStruct/reflection-based.** A `Mapper` class per entity with a
`toDto(Entity)` and `toEntity(Dto)` method (see the reference for the exact shape) — this
keeps the conversion visible and debuggable, which matters more here than saving a few lines.

## Step 3 — Monolith with views? Wire up Thymeleaf + Tailwind

Only when the project serves HTML (not a pure REST API): read
`references/thymeleaf-tailwind.md` and copy the three files from `assets/templates/` into
`src/main/resources/templates/layouts/base.html`, `.../fragments/header.html`, and
`.../fragments/footer.html`. Every new page template extends `layouts/base.html` and includes
the header/footer fragments rather than repeating the shell — that's the entire point of the
shared layout. The reference doc shows how a controller returns a view that uses it.

## Step 4 — Verify it runs

Prefer `./mvnw -DskipTests spring-boot:run` as the default way to start the app locally (on
Windows, `.\mvnw.cmd` if the user is in PowerShell/cmd rather than a POSIX shell). Skipping
tests here is about a fast local run, not about avoiding testing — don't skip tests when
actually building/packaging for real use.

## Step 5 — Register this skill in the project's CLAUDE.md

Whenever this skill scaffolds or meaningfully touches a project, make sure the project's root
`CLAUDE.md` documents it — create `CLAUDE.md` if it doesn't exist yet, or add to it if it does
(don't overwrite other content already there). Use these two sections, matching whatever
format the rest of the file already uses if it has entries for other skills:

```markdown
## Available Skills

- **spring-boot-best-practices**: Scaffolds Spring Boot projects (Java 25, Maven) with a
  controller/service/repository/model layered architecture, DTOs as records, explicit
  mappers, and Thymeleaf + Tailwind views for monoliths.

## Skills Trigger Rules

- Usa **spring-boot-best-practices** al crear un proyecto Spring Boot (API REST o monolito
  con Spring Web), o al crear/agregar/modificar un entity, repository, service o controller
  en un proyecto Spring existente.
```

This keeps future sessions (with or without this conversation's context) aware that the
project already has a documented convention to follow instead of reinventing one.
