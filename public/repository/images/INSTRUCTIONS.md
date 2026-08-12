# Instructions: How to Add Images to Questions

We have set up the image folder at `/public/repository/images/`.

Here are the templates you can copy and paste into the `"question"` field in your JSON database files when you need to insert an image or a graph.

---

## 1. Centered Image Template (Recommended)

Copy and paste this HTML block directly into your JSON question text where the image should appear:

```html
<div class="my-4 flex justify-center"><img src="/repository/images/YOUR_IMAGE_NAME.png" alt="Diagram" class="max-h-[300px] w-auto rounded-2xl border border-border-subtle shadow-md bg-white p-2" /></div>
```

*Replace `YOUR_IMAGE_NAME.png` with the actual filename of your image.*

### Example JSON integration:
```json
{
  "id": 15,
  "question": "Identify the structure of the molecule below:<div class=\"my-4 flex justify-center\"><img src=\"/repository/images/molecule_structure.png\" alt=\"Molecule\" class=\"max-h-[300px] w-auto rounded-2xl border border-border-subtle shadow-md bg-white p-2\" /></div>Select the correct option:",
  "options": [ ... ]
}
```

---

## 2. Inline Image Template (For Small Icons/Formulas)

If you want the image to stay inline with the text (e.g. for small molecular structures or math equations):

```html
<img src="/repository/images/equation_1.png" alt="Equation" class="inline-block h-6 w-auto align-middle px-1" />
```

---

## Tailwind CSS Classes Explained:
* `my-4`: Adds vertical spacing above and below the image.
* `flex justify-center`: Centers the image horizontally.
* `max-h-[300px]`: Prevents the image from being too large on desktop screens.
* `w-auto`: Maintains the original aspect ratio of the image.
* `rounded-2xl`: Adds soft, modern rounded corners to match the premium theme.
* `border border-border-subtle`: Adds a subtle, clean outline.
* `shadow-md`: Adds a premium soft shadow.
* `bg-white p-2`: Adds a clean white background padding (ideal for dark mode compatibility).
