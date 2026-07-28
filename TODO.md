# AI Jury - Bug Fixes & Improvements

## Step 1: Remove Pricing Section from Landing Page
- [x] Remove `pricingPlans` array from `Landing.tsx`
- [x] Remove the "View Pricing" button in the hero section
- [x] Remove the pricing section HTML block

## Step 2: Fix AgentFlowDiagram Email Agent ID Mismatch
- [x] Change `'email_dispatch'` to `'email_agent'` in `AgentFlowDiagram.tsx`

## Step 3: Fix Email Config Usage
- [x] Import `get_email_config` from state_manager in `agent_email.py`
- [x] Update `compose_and_send_email()` to use saved SMTP config with env var fallback
- [x] Added `use_tls` support from saved config
- [x] Added dynamic `sender_name` from saved config

## Step 4: Add User-Facing Error Feedback
- [x] Add ToastNotification component to Chat.tsx
- [x] Show error messages when API fails (connection errors, backend down)
- [x] Show error when session processing fails

## Step 5: Fix Chat Message Display for New Sessions
- [x] Add optimistic message display for first query
- [x] Add `pendingMessages` state for instant user feedback
- [x] Improve polling logic to handle errors gracefully

## Step 6: Verify build
- [x] Frontend Vite build - SUCCESS (no errors)
- [ ] Start backend server

