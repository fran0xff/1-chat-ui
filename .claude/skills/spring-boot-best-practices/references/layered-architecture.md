# Layered Architecture Conventions

Every entity slice this skill produces — new project or existing one — follows this exact
shape. The worked example below uses a `Product` entity; swap the name/fields for whatever the
user actually asked for, but keep the layering and the reasoning behind it.

## Why this shape

Each layer has exactly one job, so a bug or a change request points you at exactly one file:

- **`controller`** — HTTP only: route, validate the incoming shape, delegate, return a DTO.
  No `EntityManager`, no repository calls, no business rules here.
- **`service`** — the business logic and the only layer allowed to call repositories or use
  the mapper. If two controllers need the same behavior, it lives here once.
- **`repository`** — pure data access, `JpaRepository` gives you this for free; add query
  methods here, not query logic in the service.
- **`model`** — the JPA entity, the source of truth for what's actually persisted, including
  fields the outside world never sees.
- **`dto`** — the outside world's view of the entity. Deliberately narrower than the entity.
- **`mapper`** — the only place that knows how to go from one to the other, so that
  conversion logic never gets duplicated or drifts between endpoints.

## 1. Model (`models/Product.java`)

Plain JPA entity — a class, not a record (JPA needs a mutable no-args constructor and proxies
entities, which records can't support). Include whatever fields the domain needs, including
ones the DTO will deliberately omit (timestamps here, but the same idea applies to things like
a `password` hash on a `User` entity).

```java
package com.andres.course.claude.springboot.<artifactId>.app.models;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Product() {
        // JPA
    }

    public Product(String name, BigDecimal price) {
        this.name = name;
        this.price = price;
    }

    @PrePersist
    void onCreate() {
        var now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
```

## 2. DTO (`dtos/ProductDto.java`)

A `record`, not a class — DTOs are immutable data carriers, which is exactly what records are
for. **One DTO serves both the request and the response** (this project's convention — don't
split into `ProductRequest`/`ProductResponse` unless the user asks for that explicitly). Leave
out anything sensitive or internal: no `password`, no `createdAt`/`updatedAt` (or
`created_at`/`updated_at`) fields, ever, regardless of whether the entity has them.

```java
package com.andres.course.claude.springboot.<artifactId>.app.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record ProductDto(
    Long id,
    @NotBlank String name,
    @Positive BigDecimal price
) {}
```

`id` is `null` on create requests and populated on responses — the same record covers both
without needing two types. Put `jakarta.validation` annotations directly on the record
components; `@Valid` on the controller parameter is what actually triggers them.

## 3. Mapper (`mappers/ProductMapper.java`)

Explicit, hand-written conversion — no MapStruct/reflection magic. It's a few extra lines per
entity in exchange for conversions that are easy to read and step through when something's
wrong.

```java
package com.andres.course.claude.springboot.<artifactId>.app.mappers;

import com.andres.course.claude.springboot.<artifactId>.app.dtos.ProductDto;
import com.andres.course.claude.springboot.<artifactId>.app.models.Product;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public ProductDto toDto(Product entity) {
        return new ProductDto(entity.getId(), entity.getName(), entity.getPrice());
    }

    public Product toEntity(ProductDto dto) {
        return new Product(dto.name(), dto.price());
    }
}
```

`toEntity` only needs to populate what the entity's constructor takes on create — the service
is what decides whether it's inserting a new row or applying an update to an existing one, see
below.

## 4. Repository (`repositories/ProductRepository.java`)

Just the interface — let Spring Data generate the implementation. Add derived-query methods
here (`findByNameContainingIgnoreCase`, etc.) as the feature needs them; don't put that logic in
the service.

```java
package com.andres.course.claude.springboot.<artifactId>.app.repositories;

import com.andres.course.claude.springboot.<artifactId>.app.models.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
}
```

## 5. Service (`services/ProductService.java`)

Owns the business logic, is the only layer talking to the repository and the mapper, and is
what actually decides create-vs-update semantics (the mapper alone can't know that — it just
converts shapes).

```java
package com.andres.course.claude.springboot.<artifactId>.app.services;

import com.andres.course.claude.springboot.<artifactId>.app.dtos.ProductDto;
import com.andres.course.claude.springboot.<artifactId>.app.mappers.ProductMapper;
import com.andres.course.claude.springboot.<artifactId>.app.models.Product;
import com.andres.course.claude.springboot.<artifactId>.app.repositories.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository repository;
    private final ProductMapper mapper;

    public ProductService(ProductRepository repository, ProductMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public List<ProductDto> findAll() {
        return repository.findAll().stream().map(mapper::toDto).toList();
    }

    public ProductDto findById(Long id) {
        return mapper.toDto(getOrThrow(id));
    }

    public ProductDto create(ProductDto dto) {
        Product saved = repository.save(mapper.toEntity(dto));
        return mapper.toDto(saved);
    }

    public ProductDto update(Long id, ProductDto dto) {
        Product existing = getOrThrow(id);
        existing.setName(dto.name());
        existing.setPrice(dto.price());
        return mapper.toDto(repository.save(existing));
    }

    public void delete(Long id) {
        repository.delete(getOrThrow(id));
    }

    private Product getOrThrow(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new java.util.NoSuchElementException("Product " + id + " not found"));
    }
}
```

Swap the "not found" exception for whatever error-handling convention the rest of the project
already uses if one exists (e.g. a `@ControllerAdvice`); introduce one consistently across all
services if the project doesn't have one yet rather than inventing a different pattern per
entity.

## 6. Controller (`controllers/ProductController.java`)

HTTP concerns only: route, `@Valid` the body, delegate to the service, return a DTO (Spring
serializes it to JSON automatically — no manual mapping here, that already happened in the
service).

```java
package com.andres.course.claude.springboot.<artifactId>.app.controllers;

import com.andres.course.claude.springboot.<artifactId>.app.dtos.ProductDto;
import com.andres.course.claude.springboot.<artifactId>.app.services.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
    }

    @GetMapping
    public List<ProductDto> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ProductDto findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductDto create(@Valid @RequestBody ProductDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public ProductDto update(@PathVariable Long id, @Valid @RequestBody ProductDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
```

## Applying this to a different entity

Replace `Product`/`product` throughout with the requested entity name, adjust the fields in the
model/DTO/mapper to match what the user asked for, and keep excluding anything sensitive or
internal from the DTO. The six files always come as a set — don't create a repository without
its service, or a service without its controller, unless the user specifically asked for a
partial slice.
