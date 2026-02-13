# How to Install Flutter SDK

You are seeing the `flutter : The term 'flutter' is not recognized` error because the Flutter Software Development Kit (SDK) is not installed or not configured in your system's PATH.

## Option 1: Automated Installation (Recommended)

If you have `winget` (Windows Package Manager) installed, you can simply run:

```powershell
winget install Google.Flutter
```

After installation, **restart your terminal** (close and reopen VS Code) for the changes to take effect.

## Option 2: Manual Installation

1.  **Download**:
    *   Go to the [official Flutter website](https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.19.0-stable.zip) (link for stable release).
    *   Download the zip file.

2.  **Extract**:
    *   Extract the `flutter` folder to a permanent location, e.g., `C:\src\flutter`.
    *   *Do not* install it in a folder like `Program Files` that requires elevated privileges.

3.  **Update Path**:
    *   Search for "Edit environment variables for your account" in the Windows Search bar.
    *   In the "User variables" section, check if there is an entry called `Path`.
    *   If yes, edit it and append the full path to `flutter\bin`. (e.g., `C:\src\flutter\bin`).
    *   If no, create a new variable named `Path` with the full path to `flutter\bin`.

4.  **Verify**:
    *   Open a new PowerShell window.
    *   Run `flutter doctor`.
