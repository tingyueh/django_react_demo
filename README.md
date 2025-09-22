
django_react_demo
===================

Small demo project: Django backend (DRF) + React frontend served by Django templates/static.

Quick overview
--------------
- Backend: Django 4.2.x, Django REST Framework
- Frontend: React (legacy code) bundled with webpack -> output: `assets/bundles/main.js`
- SPA entry: `templates/index.html` mounts React into `<div id="app"></div>` and loads `static/bundles/main.js`

Requirements
------------
- macOS / Linux / Windows with Python 3.10+ (3.10 used during development)
- Node.js (>=18 recommended) and npm

Environment setup (backend)
---------------------------
1. Create and activate a virtual environment (recommended):

	python3 -m venv .venv
	source .venv/bin/activate

2. Install Python dependencies:

	pip install -r requirements.txt

3. Run database migrations:

	python manage.py migrate --settings=django_react_auth.settings

4. Create a superuser (optional):

	python manage.py createsuperuser --settings=django_react_auth.settings

5. Run the development server:

	python manage.py runserver --settings=django_react_auth.settings

	The site will be available at: http://127.0.0.1:8000/

Frontend (build locally)
------------------------
This project uses a webpack build that outputs to `assets/bundles/main.js`. If you change frontend code, rebuild:

1. Install node dependencies (one-time):

	npm install

2. Build the bundle:

	npm run build

3. The built file will be written to `assets/bundles/main.js` and served by Django's static files in development.

Notes about development flow
----------------------------
- Access the SPA at `/app/` (root `/` redirects to `/app/`).
- `templates/index.html` contains a small client-side fallback that will redirect `/` -> `/app/`.

Troubleshooting: blank/white page
--------------------------------
If the page is blank after loading:

1. Open browser DevTools (Console) and look for JavaScript errors. Copy paste the errors here when asking for help.
2. Confirm the static bundle is served:

	curl -I http://127.0.0.1:8000/static/bundles/main.js

	Expect HTTP 200 and Content-Type: application/javascript
3. Confirm the index loads and redirects as expected:

	curl -I http://127.0.0.1:8000/
	curl -I http://127.0.0.1:8000/app/

4. If the bundle loads but the app does not mount, check the browser console for exceptions and verify `document.getElementById('app')` exists in the served `index.html`.

Git and repo hygiene
--------------------
- The repo currently has `.venv/`, `db.sqlite3`, and `runserver.log` untracked. Consider adding these to `.gitignore`.
- The built `assets/bundles/main.js` is currently tracked. For a cleaner repo, you may prefer to remove it from git and serve builds via CI or static hosting.

Pushing to GitHub
-----------------
- Ensure you have a remote configured (`git remote -v`).
- Commit local changes and `git push origin master` (or your branch).

What I changed in this repo (high level)
----------------------------------------
- Upgraded code to run on modern Django (4.2.x) — updated `settings.py` for MIDDLEWARE, CORS, and DEFAULT_AUTO_FIELD.
- Fixed template static tag (`{% load static %}`) and added a client-side fallback redirect for `/` -> `/app/`.
- Adjusted URL configuration to serve the SPA at `/app/` and redirect `/` to `/app/`.

If you want, I can also:
- Add a `.gitignore` and remove unwanted files from version control.
- Add a tiny automated smoke test.
- Help debug the front-end blank page by capturing browser console logs or running a headless browser.

License
-------
This README is provided as-is for your project.
