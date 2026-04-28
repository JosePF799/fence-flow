# FenceFlow APS Setup

These are the Netlify environment variables needed to move `shop-drawings.html` from dry-run mode into real Autodesk Platform Services submission.

## Required

- `APS_CLIENT_ID`
  Your Autodesk Platform Services app client id.

- `APS_CLIENT_SECRET`
  Your Autodesk Platform Services app client secret.

- `APS_AUTOCAD_ACTIVITY_ID`
  Published Design Automation activity alias.
  Example: `fenceflow.chainlink-detail+prod`

- `APS_TEMPLATE_OBJECT_ID`
  Full APS object id for the base DWG template.
  Example: `urn:adsk.objects:os.object:fenceflow-cad-templates/pro-fence-chain-link-sheet.dwg`

  Or use:

- `APS_TEMPLATE_OBJECT_PREFIX`
  Prefix used to build the template object id from the selected template name.

- `APS_OUTPUT_OBJECT_PREFIX`
  APS object prefix where generated PDF/DWG files will be written.
  Example: `urn:adsk.objects:os.object:fenceflow-generated`

## Optional

- `APS_DA_REGION`
  Defaults to `us-east`.

- `APS_DA_BASE_URL`
  Override the Design Automation base URL if needed.
  Default: `https://developer.api.autodesk.com/da/us-east/v3`

- `APS_AUTOCAD_APPBUNDLE_ID`
  Used in the activity blueprint preview returned by the function.
  Example: `fenceflow.fenceflow-cad-plugin+prod`

- `APS_AUTOCAD_ENGINE`
  Defaults to `Autodesk.AutoCAD+26_0`

- `APS_CALLBACK_URL`
  Optional Design Automation callback URL when you are ready to handle completion callbacks.

## Current behavior

When the required variables are missing:
- FenceFlow still generates the CAD request packet
- the Netlify function still builds the APS payload preview
- the request stays in simulated mode

When the required variables are present:
- FenceFlow requests a real APS OAuth v2 token
- submits the real Design Automation workitem
- returns the APS workitem id and report url metadata to the page
