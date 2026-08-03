---
name: tanstack-form
description: Build or edit forms in webapp/ using TanStack React Form + shadcn/ui Field primitives — the standard for new forms in this repo (validation, submit state, field composition). Use when adding a form, adding form validation, or wiring a form to an API mutation.
---

# TanStack Form + shadcn Field (webapp/)

`@tanstack/react-form` is the standard for **new** forms in `webapp/`.
Reference implementations that informed this skill: [TanStack Form React
docs](https://tanstack.com/form/latest/docs/framework/react/guides/basic-concepts),
[shadcn's own TanStack Form
guide](https://ui.shadcn.com/docs/forms/tanstack-form), and
[`TheOrcDev/simple-shadcn-tanstack-field-form`](https://github.com/TheOrcDev/simple-shadcn-tanstack-field-form)
— all three converge on the same pattern below.

`webapp/src/app/(main)/membres/[id]/settings/page.tsx` (`AccountSection`) is
the first real example in this codebase — copy its shape for new forms.

**Not a migration mandate.** `react-hook-form` is still used in
`auth/_components/{login,register}-form.tsx` and the `dashboard/invoice/`
demo. Leave those alone unless you're already rewriting them for another
reason — this skill governs new forms, not a bulldoze of old ones.

## The pattern

1. A `zod` schema (this repo is on zod v4, already a dependency) — colocate
   it in the form file if it's only used there, or `lib/validations/*.ts` if
   shared.
2. `useForm` from `@tanstack/react-form`, `validators: { onChange: schema }`.
3. `form.Field` render props bound to `Field`/`FieldLabel`/`FieldError`/
   `FieldGroup`/`FieldDescription` from `@/components/ui/field` (already
   installed — do not build custom field wrappers, do not reach for raw
   `<div>`s around inputs). Pass the render function as **JSX children**
   (`<form.Field name="x">{(field) => ...}</form.Field>`), not a `children=`
   prop — this repo's Biome config (`lint/correctness/noChildrenProp`) flags
   the latter as an error, even though TanStack's own docs show it that way.
4. `form.Subscribe` for submit-button state — never a hand-rolled
   `isSubmitting` `useState`.
5. `toast.success`/`toast.error` from `sonner` (already wired app-wide via
   `src/app/layout.tsx`) for submit feedback — matches the existing auth
   forms' convention.

### Text field

```tsx
<form.Field name="first_name">
  {(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor={field.name}>Prénom</FieldLabel>
        <Input
          id={field.name}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
        />
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    );
  }}
</form.Field>
```

The `isTouched && !isValid` gate matters: it keeps errors from flashing on
every field before the user has interacted with it. Always compute it this
way, don't just check `field.state.meta.errors.length`.

### Full form skeleton

```tsx
"use client";

import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const schema = z.object({
  first_name: z.string().trim().min(1, "Le prénom est requis"),
});

export function ExampleForm() {
  const form = useForm({
    defaultValues: { first_name: "" },
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      try {
        await someApiMutation(value);
        toast.success("Enregistré.");
      } catch {
        toast.error("Échec de l'enregistrement.");
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field name="first_name">{/* as above */ (f) => null}</form.Field>
      </FieldGroup>
      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" disabled={!canSubmit}>
            {isSubmitting ? "Enregistrement…" : "Enregistrer"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
```

### Reset

```tsx
<Button type="button" variant="outline" onClick={() => form.reset()}>
  Réinitialiser
</Button>
```

Never `type="reset"` — it fights native HTML form reset instead of using
TanStack Form's own reset.

### Defaults that load asynchronously (e.g. from a store/API)

`defaultValues` are captured once at `useForm()` call time — TanStack Form
does not re-track them if the source data arrives later (e.g. a
`useCurrentUser()`-style hook that starts `null` and resolves after a
fetch). Re-seed explicitly:

```tsx
useEffect(() => {
  if (user) form.reset({ first_name: user.first_name ?? "" });
}, [user, form.reset]);
```

### Async / server-checked validation

```tsx
validators: {
  onChange: schema,
  onChangeAsync: async ({ value }) => {
    const taken = await checkEmailTaken(value.email);
    return taken ? "Cet email est déjà utilisé." : undefined;
  },
},
```

Prefer `onBlurAsync` over `onChangeAsync` for anything that hits the network
per keystroke.

## When forms start repeating

Once ~3+ forms in this codebase share the same field types (a `TextField`,
a `SelectField`, etc. re-implemented per form), graduate to TanStack's
[form composition
pattern](https://tanstack.com/form/latest/docs/framework/react/guides/form-composition):
`createFormHookContexts` + `createFormHook` → a shared `useAppForm`/
`withForm`. That centralizes the render-prop boilerplate into bound
components (`form.AppField` + `field.TextField`) instead of repeating it in
every form file. Don't build this preemptively for one or two forms — it's
pure overhead until the duplication is real.

## Don't

- Don't introduce `react-hook-form` in new forms — TanStack Form is the
  standard from here on.
- Don't bypass `Field`/`FieldLabel`/`FieldError` with ad-hoc markup — they
  carry the `data-invalid`/`aria-invalid` wiring and spacing this app's
  forms rely on for consistent a11y and styling.
- Don't hand-roll `isSubmitting`/error-string `useState` — `form.Subscribe`
  and `field.state.meta` already provide it reactively.
- Don't validate everything with `onChangeAsync` — reserve async validators
  for checks that genuinely require a network round-trip (uniqueness, etc.);
  everything else is a plain sync `onChange` validator via the zod schema.
