# GitHub Upload Guide

Follow these steps to upload your `dashboard` directory to GitHub safely, ensuring your private Firebase URLs are not exposed.

## Important Prerequisite: Check Your Files
Before starting, ensure you have the following files in your folder:
- `index.html`
- `app.js`
- `styles.css`
- `config.js` (Contains your REAL Firebase URLs. *This will be ignored by Git*)
- `config.example.js` (Contains dummy URLs. *This will be uploaded to GitHub*)
- `.gitignore`
- `README.md`

Because we have a `.gitignore` file, `config.js` will be automatically excluded from the upload, keeping your database safe!

---

## Option 1: Using GitHub Desktop (Recommended for Beginners)

1. Open **GitHub Desktop**.
2. Go to **File > Add local repository...**
3. Click **Choose...** and select the main folder containing your project (e.g., `Helios-AI-2026-main`). Click **Add repository**.
   *(Note: If Git isn't initialized yet, GitHub Desktop will offer to create a repository here).*
4. In the left panel, you will see the changed files. You should see `README.md`, `.gitignore`, `config.example.js`, `app.js`, etc.
   **Crucial Check:** Guarantee that `config.js` is **NOT** in this list.
5. At the bottom left, enter a summary like: *"Initial commit of Frontend UI with secure config"*.
6. Click the blue **Commit to main** button.
7. Click **Publish repository** (top right or center) to push it to GitHub.com. Fill in the repository details and click Publish. Ensure "Keep this code private" is unchecked if you want it to be public.

---

## Option 2: Using the Command Line (Git Bash / Command Prompt)

1. Open your terminal or command prompt.
2. Navigate to your project directory.
   ```bash
   cd C:\Users\Asus\Documents\Univerisity\kitahack\Helios-AI-2026-main\Helios-AI-2026-main
   ```
3. Look at your current status to see what is modified or untracked.
   ```bash
   git status
   ```
   *(Ensure `dashboard/config.js` is NOT listed here. If it is hidden, `.gitignore` is working!)*
4. Stage all changes.
   ```bash
   git add .
   ```
5. Commit the changes.
   ```bash
   git commit -m "Add frontend dashboard with separated configuration"
   ```
6. Push to your GitHub repository.
   ```bash
   git push origin main
   ```
   *(Change `main` to `master` depending on your default branch name).*
