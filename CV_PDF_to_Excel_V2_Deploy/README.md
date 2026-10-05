# Annexure Convertor V2 — GitHub + Vercel + Render

This repository is the deployment-ready version of the CV PDF → Excel tool.

## What V2 includes

- One or multiple PDF upload.
- Extracts CV Number, Date, Machine Number, Capacity (`Max`), Class, Customer Name, Location, Stamping Fee, 50% Additional Fee and OD.
- Uses the supplied `OLA- Anexxure XXI_stamping service.xlsx` template.
- Location is `HOSUR`.
- Service charge defaults to ₹500 per certificate and can be changed.
- CC / TA-DA defaults to ₹100 per uploaded PDF, not per certificate.
- `50% Additional Fee` is populated only when that label exists in the certificate; otherwise Site Stamping Fees remains blank.
- OD is blank when missing or zero.
- Editable review screen before generating the workbook.
- Combined Excel mode.
- Separate Excel per PDF mode, delivered as a ZIP.
- Production API URL through `NEXT_PUBLIC_API_URL`.
- Optional shared app password through `APP_PASSWORD`.
- Formula recalculation settings enabled for the generated workbook.
- Template sample data is cleared from unused rows.
- Extra data rows are added before the template's total/signature section when required.

## Repository layout

```text
CV_PDF_to_Excel_V2_Deploy/
├── backend/
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── page.js
│   │   ├── layout.js
│   │   └── globals.css
│   ├── package.json
│   └── .env.example
├── template/
│   └── OLA_Annexure_XXI_template.xlsx
├── render.yaml
├── .gitignore
└── README.md
```

# 1. Put the project on GitHub

## Option A — easiest on Windows: GitHub Desktop

1. Install GitHub Desktop.
2. Sign in to GitHub.
3. Choose **File → Add local repository**.
4. Select this project folder.
5. Create a GitHub repository from GitHub Desktop.
6. Prefer **Private** for this business tool.
7. Publish the repository.

## Option B — PowerShell / Git Bash

Open a terminal inside the project folder:

```powershell
git init
git add .
git commit -m "Initial deployment-ready CV PDF to Excel app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/cv-pdf-to-excel.git
git push -u origin main
```

Create the empty GitHub repository first. Do not add another README or .gitignore there, because this project already contains them.

# 2. Deploy the FastAPI backend to Render

Render is used for the Python/PDF/Excel part.

1. Open Render and sign in with the same GitHub account.
2. Choose **New → Web Service**.
3. Connect your GitHub repository.
4. Choose the repository you just pushed.
5. Use these settings:

```text
Name: annexure-convertor
Branch: main
Root Directory: backend
Runtime: Python
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
Health Check Path: /health
Plan: Free (for testing)
```

Render supports Git-linked web services and redeploys them when the linked branch receives new pushes.

## Environment variables on Render

Add:

```text
FRONTEND_URL=https://YOUR-VERCEL-APP.vercel.app
APP_PASSWORD=your-private-password
```

`FRONTEND_URL` can be changed after Vercel gives you the actual address.

`APP_PASSWORD` is optional. When it is set, the web app shows an App password field and the API rejects requests without the correct password.

After the first successful deployment, open:

```text
https://YOUR-RENDER-SERVICE.onrender.com/health
```

Expected response:

```json
{"status":"ok","version":"2.0.0"}
```

# 3. Deploy the Next.js frontend to Vercel

1. Open Vercel and sign in with GitHub.
2. Choose **Add New → Project**.
3. Import the same GitHub repository.
4. Set:

```text
Root Directory: frontend
Framework Preset: Next.js
```

5. Deploy.

Vercel automatically detects Next.js projects. The frontend uses Next.js 16.3.8, which is an Active LTS release as of this project version.

## Add the backend URL

In Vercel:

**Project → Settings → Environment Variables**

Add:

```text
Name:
NEXT_PUBLIC_API_URL

Value:
https://YOUR-RENDER-SERVICE.onrender.com
```

Enable it for Production (and Preview if desired), then redeploy.

# 4. Update the Render frontend URL

After Vercel gives you the final URL, return to Render and set:

```text
FRONTEND_URL=https://YOUR-VERCEL-APP.vercel.app
```

Then redeploy the backend.

# 5. Final workflow

After deployment, you will use only:

```text
Open Vercel URL
    ↓
Upload one or multiple PDFs
    ↓
Preview & Extract
    ↓
Edit/verify records
    ↓
Generate Excel
```

No local Uvicorn command is required for normal use.

# 6. Updating the application later

Make changes locally, then:

```powershell
git add .
git commit -m "Update extraction rules"
git push
```

Vercel rebuilds the frontend and Render rebuilds the backend from the linked Git branch.

# 7. Current business rules

| PDF field | Excel field |
|---|---|
| CV No | VC Number |
| Date | VC Date |
| Machine No | Machine Number |
| Max | Capacity |
| Class | Class |
| text after `belonging to M/S` | Customer Name |
| fixed value | Location = HOSUR |
| Stamping Fee | Actual Stamping Fees |
| 50% Additional Fee | Site Stamping Fees |
| OD | OD Charges |
| ₹100 / uploaded PDF | CC / TA-DA |
| ₹500 / certificate | Service Charges |

Important: A missing `50% Additional Fee` does **not** cause a 50% fee to be added.

# 8. Security / privacy note

The source PDFs are uploaded to the Render backend for processing. The app does not intentionally save them to permanent storage; it processes them in memory and returns the generated workbook.

Because the backend is a public web service, use `APP_PASSWORD` for an internal tool. Also keep the GitHub repository private if the PDFs, template, or business logic are sensitive.

# 9. Free Render behavior

Render's free web service can go to sleep after 15 minutes of no incoming traffic. The next request can take roughly a minute while the service starts again.

The application does not rely on a persistent local filesystem for PDF storage, so this sleep behavior does not affect the generated business output. It mainly affects startup time.

# 10. Local development is optional

You can still run locally when developing:

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

For local development, create `frontend/.env.local`:

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
```
