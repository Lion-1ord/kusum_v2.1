import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fphabxeduhwpwxqvtspo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwaGFieGVkdWh3cHd4cXZ0c3BvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDgzODYsImV4cCI6MjA5NTk4NDM4Nn0.jVG6cXXe0DISmQlQA10WwYBu6xAPxxhxdY7SltRD36w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Note: product media/storage helpers removed as requested.

/*
Usage example:

import { uploadProductMedia, uploadMultipleProductMedia, createProductFolder } from './lib/supabaseClient';

// After creating a product and getting its UUID `productId`:
// Optionally create the folder (not required — uploading will create it implicitly)
// await createProductFolder(productId);

// Upload multiple files (FileList -> array of File)
// const results = await uploadMultipleProductMedia(productId, filesArray);

// Upload a single file
// const { data, publicURL } = await uploadProductMedia(productId, file);

Notes:
- Files must be `File` or `Blob` objects (browser uploads).
- Objects are stored under `product_media/{productId}/<filename>`.
*/

