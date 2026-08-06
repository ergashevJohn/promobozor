UPDATE "categories"
SET
  "image_url" = NULL,
  "updated_at" = NOW()
WHERE "image_url" = 'https://cdn.example.com/categories/programming.png';
