# Thymeleaf + Tailwind (monolith / Spring Web views)

Only for the "monolith with server-rendered views" case — a pure REST API doesn't need any of
this. Requires the `thymeleaf` dependency to have been included when the project was scaffolded
(see `references/project-setup.md`); if it's missing from an existing project, add
`spring-boot-starter-thymeleaf` to `pom.xml` before continuing.

## Why a shared layout

Every page needs the same `<head>` (Tailwind, viewport meta, title), the same header/navbar,
and the same footer. Repeating that markup in every template means every future change (a new
nav link, a favicon, a meta tag) has to be made in every file and will eventually drift. One
base layout + fragments means it's made once.

## Files to copy in

Copy these three files from `assets/templates/` into the project, unchanged unless the user
asks for different branding/nav items:

```
assets/templates/base.html    -> src/main/resources/templates/layouts/base.html
assets/templates/header.html  -> src/main/resources/templates/fragments/header.html
assets/templates/footer.html  -> src/main/resources/templates/fragments/footer.html
```

`base.html` uses Thymeleaf's layout dialect (`th:fragment`/`th:replace` via `th:insert`) to pull
in the header and footer fragments and to leave a `content` slot that page templates fill in.
Tailwind is loaded via the Play CDN script (`cdn.tailwindcss.com`) rather than a build pipeline
— appropriate for a course/learning project or a prototype; if this becomes a production app,
swap it for a proper Tailwind build (PostCSS + the Tailwind CLI) instead of the CDN script, but
don't set that up unless asked — it's a meaningfully bigger addition (Node toolchain, build
step wired into Maven) than this skill's scope.

## Writing a page that uses the layout

A page template only needs its own `<title>` and the content that goes in the main slot:

```html
<!DOCTYPE html>
<html lang="es" xmlns:th="http://www.thymeleaf.org"
      th:replace="~{layouts/base :: layout(~{::title}, ~{::section})}">
<head>
  <title>Productos</title>
</head>
<body>
  <section>
    <h1 class="text-2xl font-semibold text-slate-900">Productos</h1>
    <ul class="mt-4 space-y-2" th:each="product : ${products}">
      <li th:text="${product.name()}" class="rounded-lg border border-slate-200 p-3"></li>
    </ul>
  </section>
</body>
</html>
```

Place page templates directly under `src/main/resources/templates/` (e.g.
`templates/products/list.html`), keeping `layouts/` and `fragments/` reserved for the shared
shell.

## Controller returning a view

A view-returning controller is a separate class from the REST `@RestController` for the same
entity if both exist — don't mix `@Controller` (views) and `@RestController` (JSON) concerns in
one class. It still goes through the `service` layer exactly like the REST controller does.

```java
package com.andres.course.claude.springboot.<artifactId>.app.controllers;

import com.andres.course.claude.springboot.<artifactId>.app.services.ProductService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@RequestMapping("/products")
public class ProductViewController {

    private final ProductService service;

    public ProductViewController(ProductService service) {
        this.service = service;
    }

    @GetMapping
    public String list(Model model) {
        model.addAttribute("products", service.findAll());
        return "products/list";
    }
}
```

The returned string is the template path relative to `templates/`, without the `.html`
extension — Thymeleaf's Spring Boot auto-configuration resolves it.
