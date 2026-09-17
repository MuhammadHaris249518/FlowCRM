# Documents API

Storage provider: **Supabase Storage** (utilizing the existing Supabase Postgres connection and service credentials).

Base path: `/api/v1/documents`. All routes require
`Authorization: Bearer <clerk_session_token>`.

## Bucket Setup (Manual Step)

In your Supabase project dashboard:
1. Navigate to **Storage** → Create a new bucket named `documents`.
2. Set bucket privacy to **Private** (not public).
3. The API client generates short-lived signed URLs for downloading, preventing public access or guessed URLs for sensitive assets (such as contracts or IDs).

## Library vs. Linked Documents

- **Library Documents**: `contactId`, `leadId`, and `dealId` are all `null`. These represent reusable company documents (e.g. pricing sheets, product PDFs, templates) that can be linked across multiple messages or attached to automated AI drafts.
- **Linked Documents**: Associated with a specific `Contact`, `Lead`, or `Deal`.

## File Limits & Allowed Types

- **Max file size:** 25MB (`MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024`).
- **Allowed MIME types:**
  - `application/pdf`
  - `image/png`
  - `image/jpeg`
  - `application/msword` (.doc)
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (.docx)
  - `application/vnd.ms-excel` (.xls)
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (.xlsx)

---

## Endpoints

### GET /api/v1/documents

Lists documents belonging to the user's organization with optional filtering.

**Query params:**
- `contactId` (string, optional): Filter by contact.
- `leadId` (string, optional): Filter by lead.
- `dealId` (string, optional): Filter by deal.
- `library` (boolean, optional): If `true`, returns only library documents (where `contactId`, `leadId`, and `dealId` are all null).

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid...",
      "fileName": "pricing-sheet.pdf",
      "fileSize": 1048576,
      "mimeType": "application/pdf",
      "contactId": null,
      "leadId": null,
      "dealId": null,
      "uploadedByName": "Jane Doe",
      "createdAt": "2026-09-16T12:00:00.000Z"
    }
  ]
}
```

### POST /api/v1/documents

Uploads a document via multipart/form-data.

**Body (multipart/form-data):**
- `file` (binary, required): The document file.
- `contactId` (string, optional): Associated Contact ID.
- `leadId` (string, optional): Associated Lead ID.
- `dealId` (string, optional): Associated Deal ID.

**Errors:**
- `400 NO_FILE`: If no file was provided in the request.
- `400 FILE_TOO_LARGE`: If file size exceeds 25MB.
- `400 UNSUPPORTED_FILE_TYPE`: If the uploaded MIME type is not allowed.

**Response:** `201 Created` with created `DocumentDTO`.

### GET /api/v1/documents/:id/download-url

Generates a signed download URL (valid for 1 hour / 3600 seconds) for the specified document.

**Errors:**
- `404 NOT_FOUND`: If the document does not exist or belongs to another organization.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "url": "https://<supabase-project>.supabase.co/storage/v1/object/sign/documents/<key>?token=..."
  }
}
```

### DELETE /api/v1/documents/:id

Deletes the document from both Supabase Storage and the database.

**Errors:**
- `404 NOT_FOUND`: If the document does not exist or belongs to another organization.

**Response:** `204 No Content`
