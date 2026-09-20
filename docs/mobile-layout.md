# Mobile layout

- Coarse-pointer devices load a viewport-sized layout in `mobile.css`; desktop layout stays in `layout.css`.
- Landscape preserves the 960×540 world aspect ratio and uses all height below a 44px menu bar. Safe areas and dynamic browser viewport height are respected.
- Portrait keeps the full world visible, with controls below it and a landscape suggestion.
- Floating left joystick tracks one pointer; other fingers can use the action buttons. Cancellation, blur, hidden document and viewport resize reset movement.
- Relics and essences can expand; touching icons focuses their descriptions. Selection dialogs scroll independently.
- Fullscreen is offered only when supported. It is optional; mobile browsers without fullscreen still use the same layout.

## Validation

Headless Edge with touch emulation: 844×390, 667×375, 390×844. Desktop: 1280×800. No page errors or horizontal overflow. Landscape canvas sizes: 615×346 and 588×331. Dodge target: 76×76.

Real-device Safari/Chrome touch feel, browser chrome and notch behavior still need verification after deployment.

## Upload from local PowerShell

Include **mobile.css** in addition to the previous two stylesheets:

```powershell
Set-Location "C:\baggam-dev\spirebound"
$gameFiles = Get-ChildItem -File | Where-Object {
    $_.Name -in @('index.html', 'style.css', 'layout.css', 'mobile.css') -or
    ($_.Name -match '^[a-z][a-z0-9-]*\.js$' -and $_.Name -ne 'server.js')
}
scp -i "C:\baggam-dev\docs\spirebound-docs\ssh-key-2026-09-20.key" $gameFiles.FullName opc@168.107.21.43:spirebound-web/
```

Then in the server SSH session:

```bash
sudo cp ~/spirebound-web/*.html ~/spirebound-web/*.css ~/spirebound-web/*.js /usr/share/nginx/html/
sudo restorecon -Rv /usr/share/nginx/html
```

Refresh the mobile browser to load the updated HTML, CSS and modules. If stale assets remain, clear this site's cached files (not saved site data).
