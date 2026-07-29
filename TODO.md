# AI Jury - Authentication & Email Enhancement Plan ✅

## Backend Changes - ✅ Complete

### Step 1: schemas.py ✅
- [x] Make `email` required in `SignupRequest`
- [x] Add `SendReportRequest` schema

### Step 2: state_manager.py ✅
- [x] Store email with user registration (users dict: username -> {password, email})
- [x] Add `get_user_email(username)` function
- [x] Added backward compatibility for old user entries

### Step 3: agent_email.py ✅
- [x] Fix PDF text colors: changed from light (#f4f4f5) to dark (#1e293b) for readability on white paper
- [x] Add DOCX generation function `build_docx_report()`
- [x] Updated error message to mention default sender email

### Step 4: routes.py ✅
- [x] Update signup endpoint to require & store email
- [x] Update login endpoint to return user email in detail
- [x] Add `/api/send-report-email` endpoint (sends PDF to registered email)
- [x] Add `/api/export/download-docx` endpoint for DOCX export

### Step 5: requirements.txt ✅
- [x] Add `python-docx` for DOCX generation

## Frontend Changes - ✅ Complete

### Step 6: Login.tsx ✅
- [x] Add email input field for signup mode
- [x] Store username + email in localStorage after auth

### Step 7: ExportReport.tsx ✅
- [x] Keep only PDF and Document (DOCX) options
- [x] Removed JSON and Markdown export buttons

### Step 8: Chat.tsx ✅
- [x] Auto-fill email from localStorage (set during login)
- [x] Add "Send to Email" button (SendHorizonal icon) after verdict is received
- [x] Implemented `handleSendEmail` function that calls `/api/send-report-email`
- [x] Show success/error toast after email send

### Step 9: EmailSettings.tsx ✅
- [x] Default SMTP email prefilled: prajeensenthilkumar.24@gmail.com

