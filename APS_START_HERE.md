# FenceFlow APS Start Here

This is the cleanest path to get FenceFlow from dry-run mode into a real Autodesk Platform Services workflow.

## What already exists

FenceFlow already has:

- a Shop Drawings front end that builds a CAD request packet
- a Netlify function that can build and submit an APS workitem
- environment variable support for live APS submission
- a starter AutoCAD plugin scaffold in [aps-autocad-plugin](C:\Users\JosePF\Desktop\FenceFlow-Netlify\aps-autocad-plugin)

## What still needs to be created

You still need to create the Autodesk side from scratch:

1. APS Developer Hub
2. APS application
3. AutoCAD plugin bundle zip
4. Published AutoCAD activity
5. Uploaded DWG template
6. Netlify environment variables

## Step 1: Create the APS Developer Hub

Autodesk's current setup requires an APS offering assigned to a team before you can create the hub.

Official reference:

- [APS Developer Hub setup and app migration](https://aps.autodesk.com/blog/aps-developer-hub-setup-and-app-migration)

End result:

- a live APS Developer Hub
- you listed as Admin or Developer

## Step 2: Create the APS application

From Autodesk APS `My Applications`, create a new app.

Recommended app type for the current FenceFlow backend:

- `Server-to-Server App`

Reason:

- FenceFlow currently submits APS jobs from the backend with 2-legged auth
- there is no Autodesk end-user sign-in flow yet

Use `Traditional Web App` instead only if you already know you want Autodesk user sign-in later.

You will need:

- `APS_CLIENT_ID`
- `APS_CLIENT_SECRET`

Keep both for Netlify later.

Auth reference:

- [Authentication v2 update](https://aps.autodesk.com/blog/update-authentication-api-v2-now-accepts-credentials-requests-body)

Important:

- FenceFlow uses 2-legged auth for backend submission
- Automation requires the `code:all` scope

Scope reference:

- [Automation scope enforcement](https://aps.autodesk.com/blog/automation-api-enforcing-oauth-scope)

## Step 3: Build the AutoCAD plugin bundle

Local scaffold:

- [aps-autocad-plugin\README.md](C:\Users\JosePF\Desktop\FenceFlow-Netlify\aps-autocad-plugin\README.md)

Main files:

- [FenceFlowCadPlugin.csproj](C:\Users\JosePF\Desktop\FenceFlow-Netlify\aps-autocad-plugin\src\FenceFlowCadPlugin\FenceFlowCadPlugin.csproj)
- [Commands.cs](C:\Users\JosePF\Desktop\FenceFlow-Netlify\aps-autocad-plugin\src\FenceFlowCadPlugin\Commands.cs)
- [PackageContents.xml](C:\Users\JosePF\Desktop\FenceFlow-Netlify\aps-autocad-plugin\bundle\FenceFlowCadPlugin.bundle\PackageContents.xml)

Build script:

```powershell
pwsh .\aps-autocad-plugin\scripts\Build-AppBundle.ps1
```

This should create:

- `aps-autocad-plugin\dist\FenceFlowCadPlugin.bundle.zip`

Autodesk plugin tutorial:

- [Create Plugin](https://get-started.aps.autodesk.com/tutorials/design-automation/prepare-plugin/)

## Step 4: Upload the appbundle and define the activity

The activity is the Automation definition that says:

- which AutoCAD engine to run
- which appbundle to load
- which files are inputs/outputs
- which command/script gets executed

FenceFlow's current backend is already expecting an AutoCAD activity id alias like:

- `fenceflow.chainlink-detail+prod`

Recommended engine for now:

- `Autodesk.AutoCAD+26_0`

Reference:

- [AutoCAD 2026 now available in Automation](https://aps.autodesk.com/blog/autocad-2026-watt-now-available-design-automation-api)
- [Define Activity](https://get-started.aps.autodesk.com/tutorials/design-automation/define-activity/)
- [Execute Workitem](https://get-started.aps.autodesk.com/tutorials/design-automation/execute-workitem)

## Step 5: Upload the base DWG template

FenceFlow's backend expects either:

- `APS_TEMPLATE_OBJECT_ID`

or

- `APS_TEMPLATE_OBJECT_PREFIX`

For v1, keep it simple:

- one standard chain link detail sheet DWG template

Later, we can expand to multiple templates.

## Step 6: Add Netlify environment variables

Use the values in:

- [APS_SETUP.md](C:\Users\JosePF\Desktop\FenceFlow-Netlify\APS_SETUP.md)

Minimum required:

- `APS_CLIENT_ID`
- `APS_CLIENT_SECRET`
- `APS_AUTOCAD_ACTIVITY_ID`
- `APS_TEMPLATE_OBJECT_ID` or `APS_TEMPLATE_OBJECT_PREFIX`
- `APS_OUTPUT_OBJECT_PREFIX`

## Step 7: Test from FenceFlow

Once the above is ready:

1. Open Shop Drawings
2. Fill out the form
3. Click `Send CAD Request`
4. Confirm the page reports `submitted` instead of dry-run

## Recommended v1 goal

To keep momentum, the first successful Autodesk milestone should be:

- read `FenceFlowRequest.json`
- stamp request data into the template DWG
- save `result.dwg`
- plot `result.pdf`

That gets the pipeline real first.

After that, we can invest in:

- accurate chain link fitting blocks
- multiple detail templates
- gate sheets
- footing schedules
- submittal packet generation
