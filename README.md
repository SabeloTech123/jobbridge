# JobBridge

A job portal dashboard with separate views for job seekers and employers. Built as a frontend-only project — no backend required.

**Live demo:** https://sabelotech123.github.io/jobbridge/

## Features

- Sign up as a Job Seeker or an Employer, log in with email/password
- Job Seekers can browse/search/filter jobs, save jobs, apply with a cover note, and track application status
- Employers can post jobs, manage postings, and update applicant status in real time
- Fully responsive (works on mobile)

## Tech stack

HTML, CSS, and vanilla JavaScript — no frameworks, no build step. All data is stored locally in the browser (`localStorage`), so everything works offline once downloaded.

## Try it

Click **"explore a demo account"** on the login screen to jump straight into a pre-filled job seeker account, or sign up as an employer to post your own jobs.

## Running locally

Open `index.html` in any browser — that's it.

## Note

This is a personal project, still in progress. Accounts and job data are stored per-browser (no real server), and passwords are hashed client-side — fine for a demo, not production-ready authentication.
