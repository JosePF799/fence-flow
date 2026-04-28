# FenceFlow AutoCAD APS Plugin

This folder is the starting point for the real Autodesk Platform Services workflow behind FenceFlow shop drawings.

The website is already able to package a CAD request and send it to a Netlify function. This plugin is the missing AutoCAD-side piece that will eventually:

- open a base DWG template
- read `FenceFlowRequest.json`
- update title block and fence detail content
- save a finished DWG
- plot a finished PDF

## Current state

This is a real scaffold, not a finished production plugin yet.

It already includes:

- an AutoCAD .NET project
- a typed model for the FenceFlow JSON packet
- a `FenceFlowGenerateSheet` command
- a Design Automation `.bundle` manifest
- a PowerShell packaging script

It does **not** yet fully generate the final realistic fence detail or PDF output. The command currently focuses on proving the pipeline:

- load the request packet
- write visible metadata into the DWG
- save a `result.dwg`
- leave clear TODO points for the true drawing/plot logic

## Folder layout

- [src/FenceFlowCadPlugin/FenceFlowCadPlugin.csproj](C:\Users\JosePF\Desktop\FenceFlow-Netlify\aps-autocad-plugin\src\FenceFlowCadPlugin\FenceFlowCadPlugin.csproj)
- [src/FenceFlowCadPlugin/Commands.cs](C:\Users\JosePF\Desktop\FenceFlow-Netlify\aps-autocad-plugin\src\FenceFlowCadPlugin\Commands.cs)
- [src/FenceFlowCadPlugin/Models/FenceFlowRequest.cs](C:\Users\JosePF\Desktop\FenceFlow-Netlify\aps-autocad-plugin\src\FenceFlowCadPlugin\Models\FenceFlowRequest.cs)
- [bundle/FenceFlowCadPlugin.bundle/PackageContents.xml](C:\Users\JosePF\Desktop\FenceFlow-Netlify\aps-autocad-plugin\bundle\FenceFlowCadPlugin.bundle\PackageContents.xml)
- [scripts/Build-AppBundle.ps1](C:\Users\JosePF\Desktop\FenceFlow-Netlify\aps-autocad-plugin\scripts\Build-AppBundle.ps1)
- [sample/FenceFlowRequest.sample.json](C:\Users\JosePF\Desktop\FenceFlow-Netlify\aps-autocad-plugin\sample\FenceFlowRequest.sample.json)

## Local prerequisites

- AutoCAD 2026 installed locally
- Visual Studio 2022 or Build Tools
- .NET Framework 4.8 targeting pack
- PowerShell 5+ or PowerShell 7+

## Build the bundle locally

From this folder:

```powershell
pwsh .\scripts\Build-AppBundle.ps1
```

If your AutoCAD path is custom:

```powershell
pwsh .\scripts\Build-AppBundle.ps1 -AutoCADInstallDir "C:\Program Files\Autodesk\AutoCAD 2026"
```

Output zip:

- `dist\FenceFlowCadPlugin.bundle.zip`

## Commands inside AutoCAD

- `FenceFlowGenerateSheet`
- `FenceFlowSmokeTest`

`FenceFlowGenerateSheet` looks for `FenceFlowRequest.json` in the working folder used by APS Design Automation.

## Next real milestone

After this scaffold is compiling locally, the next work is inside [Commands.cs](C:\Users\JosePF\Desktop\FenceFlow-Netlify\aps-autocad-plugin\src\FenceFlowCadPlugin\Commands.cs):

- replace the placeholder metadata notes with actual chain link geometry updates
- update title block fields from the request
- plot a real `result.pdf`
- optionally save `result.dwg`

The broader Autodesk setup steps are in [APS_START_HERE.md](C:\Users\JosePF\Desktop\FenceFlow-Netlify\APS_START_HERE.md).
