/**
 * Helper to build FormData with proper array notation for Express/multer.
 *
 * Express parses multipart form-data using:
 *   - fieldName=value        → string
 *   - fieldName[]=value      → array (repeated fields)
 *   - fieldName[0][key]=val  → nested object in array
 *
 * This helper converts a flat object + file fields into FormData
 * with the correct bracket notation.
 */

/**
 * Append a value to FormData, converting arrays and objects to bracket notation.
 *
 * @param fd FormData instance
 * @param key field name (e.g. "categoryIds", "variants")
 * @param value the value to append
 */
export function appendFormValue(
  fd: FormData,
  key: string,
  value: unknown,
): void {
  if (value === undefined || value === null) return;

  if (Array.isArray(value)) {
    if (value.length === 0) {
      // Send empty array indicator
      fd.append(`${key}[]`, "");
      return;
    }
    for (const item of value) {
      if (typeof item === "object" && item !== null && !(item instanceof File)) {
        // Array of objects: variants[0][sku]=... variants[0][stock]=...
        const index = value.indexOf(item);
        for (const [objKey, objVal] of Object.entries(item)) {
          appendFormValue(fd, `${key}[${index}][${objKey}]`, objVal);
        }
      } else {
        // Array of primitives: categoryIds[]=7 categoryIds[]=8
        fd.append(`${key}[]`, String(item));
      }
    }
    return;
  }

  if (typeof value === "object" && !(value instanceof File) && !(value instanceof Blob)) {
    // Nested object: images[0][mediaId]=1 images[0][order]=0
    for (const [objKey, objVal] of Object.entries(value)) {
      appendFormValue(fd, `${key}[${objKey}]`, objVal);
    }
    return;
  }

  // Primitive or File — append directly
  fd.append(key, value as string | File);
}

/**
 * Build FormData from a body object + file fields.
 *
 * @param body flat object with all text/JSON fields
 * @param files map of field name → File or File[]
 * @returns FormData ready for upload
 */
export function buildMultipartFormData(
  body: Record<string, unknown>,
  files?: Record<string, File | File[]>,
): FormData {
  const fd = new FormData();

  // Append all body fields with proper array notation
  for (const [key, value] of Object.entries(body)) {
    appendFormValue(fd, key, value);
  }

  // Append file fields
  if (files) {
    for (const [fieldName, fileOrFiles] of Object.entries(files)) {
      if (Array.isArray(fileOrFiles)) {
        for (const f of fileOrFiles) {
          fd.append(fieldName, f);
        }
      } else {
        fd.append(fieldName, fileOrFiles);
      }
    }
  }

  return fd;
}
