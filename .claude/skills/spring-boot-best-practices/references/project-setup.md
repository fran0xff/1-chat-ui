# Project Setup — Spring Initializr

## Why Initializr instead of hand-written files

Spring Boot 4 renamed several starter artifacts (e.g. `spring-boot-starter-web` became
`spring-boot-starter-webmvc`) and Initializr also generates the Maven Wrapper correctly for
whatever Boot version you ask for. Hand-authoring `pom.xml`/`mvnw` risks silently using stale
artifact ids or an incompatible wrapper. Always generate through the API below and then edit
the result, never write these files from scratch.

## 1. Resolve the Boot version

Fetch `https://start.spring.io/metadata/client` (plain `curl`/`WebFetch` — public API, no
auth). Read `bootVersion.values`. Pick the **first entry whose id does NOT end in
`.BUILD-SNAPSHOT` or contain `.M` / `.RC`** — that's the current latest stable release. As of
this skill's last check that was `4.1.1.RELEASE`, comfortably above the user's `4.0.6` floor,
but re-check live rather than trusting this number — Spring Boot ships new versions
regularly and this skill should always pick up the current one, not a value frozen in this
doc.

If for some reason the resolved version is *below* `4.0.6` (shouldn't happen, but if Initializr
ever defaults somewhere unexpected), fall back to the newest `4.0.x.RELEASE` in the list.

## 2. Resolve the Java version

From the same metadata response, read `javaVersion.values`. Use `25` if present. If a future
Initializr update ever drops `25` from the list before Spring Boot fully supports it, fall back
to the newest LTS actually listed (e.g. `21`) and tell the user you had to fall back and why —
don't silently downgrade without saying so.

## 3. Determine the artifactId

Per this project's convention, the Maven `artifactId` (and `name`) is the **same as the
workspace directory name**. Sanitize it to a valid Maven identifier if needed (lowercase,
hyphens instead of spaces, no special characters) — Maven artifactIds are conventionally
lowercase-with-hyphens, e.g. a workspace called `Order Service` becomes `order-service`.

The `packageName` is always `com.andres.course.claude.springboot.<artifactId-without-hyphens>.app`
— Java package segments can't contain hyphens, so strip them (`order-service` → `orderservice`)
when building the package name, while the artifactId itself keeps the hyphen.

## 4. The request

```bash
curl -sG https://start.spring.io/starter.zip \
  -d type=maven-project \
  -d language=java \
  -d bootVersion=<resolved-boot-version> \
  -d baseDir=<artifactId> \
  -d groupId=com.andres.course.claude.springboot \
  -d artifactId=<artifactId> \
  -d name=<artifactId> \
  -d packageName=com.andres.course.claude.springboot.<artifactId-no-hyphens>.app \
  -d packaging=jar \
  -d javaVersion=<resolved-java-version> \
  -d dependencies=web,validation,data-jpa,h2,devtools,actuator[,thymeleaf] \
  -o <artifactId>.zip
```

Add `thymeleaf` to `dependencies` only for the monolith-with-views case (see
`references/thymeleaf-tailwind.md`).

Then, from the **project root** (the workspace root itself, not a subfolder — the artifactId
IS the workspace):

```bash
unzip -o <artifactId>.zip -d .
rm <artifactId>.zip
```

Because `baseDir=<artifactId>` was set, the zip's top-level folder is named after the
artifactId; unzip into the parent so the project root ends up holding `pom.xml`, `mvnw`,
`src/`, etc. directly. If the workspace directory itself is already named `<artifactId>`,
either extract one level up and merge, or pass `baseDir=.` instead so the zip has no wrapping
folder at all — prefer `baseDir=.` when scaffolding directly into an existing empty workspace
directory, it avoids the extra move/merge step.

## 5. Verify the result

Confirm these exist after extraction:

- `pom.xml` with `<groupId>com.andres.course.claude.springboot</groupId>`, the right
  `<artifactId>`, `<java.version>25</java.version>` (or resolved fallback), and no explicit
  `<packaging>` tag (Maven defaults to `jar`, which is what's wanted — no need to add it
  explicitly).
- `mvnw` and `mvnw.cmd` in the project root, `.mvn/wrapper/maven-wrapper.properties` present.
  `mvnw` should already be executable from the zip; if `ls -la mvnw` shows no `x` bit
  (can happen after certain checkouts), `chmod +x mvnw`.
- `src/main/resources/application.properties` (NOT `application.yml` — Initializr defaults to
  properties, which is exactly the format this project wants; don't add a YAML file alongside
  it).
- `src/main/java/.../app/<ArtifactId>Application.java` — the generated main class, left as-is.

## 6. First run

```bash
./mvnw -DskipTests spring-boot:run
```

This needs network access on first run to download the Maven distribution used by the wrapper
and the project's dependencies. If it fails with a certificate/TLS or connectivity error,
that's almost always local machine/network configuration (corporate proxy, stale CA store,
outdated `wget` shadowing `curl` on `PATH`), not a problem with the generated project — don't
try to "fix" the pom or wrapper in response to that class of error; tell the user what failed
and let them sort out their local network/JDK trust store.
