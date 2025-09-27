# django_react_demo

Single-page data-cleaning demo that pairs a Django REST backend with a legacy React frontend. The latest iteration adds an LLM-assisted “natural language → regex” flow, preview tooling, and exporting of processed files.

## Features
- **Authentication & dataset upload** powered by Django REST Framework.
- **LLM regex compiler**: send a natural-language description (optionally with column samples) to the configured OpenAI-compatible endpoint and receive `pattern`, `flags`, and `explanations`.
- **Preview & apply UI**: run the regex on the uploaded file, inspect match counts plus sample rows, then export a transformed CSV.
- **Fire-and-forget frontend** bundled with webpack (`assets/bundles/main.js`) and served by Django static files.

## Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Access to an OpenAI-compatible API (e.g. OpenAI, Volcano Engine Ark) with model + key.

## Backend Setup
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate --settings=django_react_auth.settings
python manage.py createsuperuser --settings=django_react_auth.settings  # optional
```

### LLM Configuration
Set these environment variables **before** running the server:

| Variable | Description |
| --- | --- |
| `OPENAI_API_KEY` | API key or token. Ark users can reuse `ARK_API_KEY`. |
| `OPENAI_BASE_URL` | Base URL of the OpenAI-compatible endpoint, e.g. `https://api.openai.com/v1` or `https://ark.cn-beijing.volces.com/api/v3`. |
| `LLM_MODEL` | Target model or endpoint ID (Ark often uses IDs like `ep-xxxx` or names such as `deepseek-...`). |
| `LLM_PROVIDER` *(optional)* | Defaults to `openai`; purely informational. |

Example (Ark DeepSeek model):
```bash
export OPENAI_API_KEY="<your-ark-api-key>"
export OPENAI_BASE_URL="https://ark.cn-beijing.volces.com/api/v3"
export LLM_MODEL="deepseek-v3-1-250821"
python manage.py runserver --settings=django_react_auth.settings
```

Processed CSV downloads are written to `media/`, configured via `MEDIA_URL`/`MEDIA_ROOT` in `django_react_auth/settings.py`.

## Frontend Build
The React bundle lives under `assets/js/` and is compiled to `assets/bundles/main.js`.
```bash
npm install
npm run build
```
Each rebuild will overwrite `assets/bundles/main.js`; Django serves it automatically in development.

## Running the App
1. Start Django with the environment variables configured.
2. Visit `http://127.0.0.1:8000/app/` (root `/` redirects to `/app/`).
3. Upload a CSV/XLSX dataset. The API will stash the file and return a `file_id`.
4. In **NL → Regex**, describe your pattern. Optional: provide target columns (comma-separated) so the backend can send column samples to the LLM.
5. Review the generated pattern/flags/explanation. If needed, refine the prompt and retry.
6. Use **Preview** to inspect match counts and a 20-row sample. Adjust prompts or replacement text until it looks right.
7. Click **Apply & Download** to transform the full dataset and obtain the new CSV via the provided link.

## Prompt Authoring Tips
- Mention the **column name** and **edge cases** (e.g., “optional building names”, “range like 660-674”, “suburb is ALL CAPS with spaces”).
- If results drift, tweak the prompt and rerun preview; previous inputs remain in the form for faster iteration.
- Additional regression-friendly few-shot samples live in `llm/services.py`. Extend `FEW_SHOTS` if your domain needs more guidance.

## Troubleshooting
- **LLM 404 / auth errors**: confirm `OPENAI_BASE_URL`, `LLM_MODEL`, and API key match your provider docs.
- **`LLM returned non-JSON`**: provider may wrap JSON in Markdown fences; `_extract_json_payload` already strips them, but copy the raw API response from logs if it persists.
- **Preview empty**: ensure you uploaded a file and that the prompt targets the correct columns; no matches yields an empty table.
- **Static bundle stale**: rerun `npm run build` after editing `assets/js/*.jsx`.

## Project Layout
```
assets/            # React source (JSX) and compiled bundle
llm/               # Regex compilation views, services, and safety helpers
api/               # Existing REST endpoints (users, file upload)
templates/index.html
```

## Housekeeping
- `db.sqlite3`, `media/`, and other runtime artefacts are local-only—avoid committing them.
- Add your Git remote and push as usual (`git push origin master`); network access may require VPN/proxy in some environments.

Enjoy automating regex generation with natural language prompts!
