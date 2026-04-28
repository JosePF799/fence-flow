function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    },
    body: JSON.stringify(body)
  };
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function slugify(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "fenceflow";
}

function packageTargets(outputPackage) {
  const text = normalizeText(outputPackage).toLowerCase();
  return {
    pdf: true,
    dwg: text.includes("dwg"),
    previewPng: text.includes("png")
  };
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`
  };
}

function asObjectId(base, objectName) {
  const root = normalizeText(base).replace(/\/+$/, "");
  return `${root}/${encodeURIComponent(objectName)}`;
}

function envPresent(key) {
  return Boolean(normalizeText(process.env[key]));
}

function sanitizeHeaders(headers) {
  if (!headers) return headers;
  const clone = { ...headers };
  if (clone.Authorization) clone.Authorization = "Bearer <APS_ACCESS_TOKEN>";
  return clone;
}

function sanitizeWorkitemPayload(workitem) {
  return {
    ...workitem,
    arguments: Object.fromEntries(
      Object.entries(workitem.arguments || {}).map(([key, value]) => [
        key,
        {
          ...value,
          headers: sanitizeHeaders(value.headers)
        }
      ])
    )
  };
}

function getApsReadiness() {
  return [
    {
      key: "APS_CLIENT_ID",
      present: envPresent("APS_CLIENT_ID"),
      purpose: "APS OAuth client id for 2-legged auth"
    },
    {
      key: "APS_CLIENT_SECRET",
      present: envPresent("APS_CLIENT_SECRET"),
      purpose: "APS OAuth client secret for 2-legged auth"
    },
    {
      key: "APS_AUTOCAD_ACTIVITY_ID",
      present: envPresent("APS_AUTOCAD_ACTIVITY_ID"),
      purpose: "Published APS AutoCAD activity alias"
    },
    {
      key: "APS_TEMPLATE_OBJECT_ID or APS_TEMPLATE_OBJECT_PREFIX",
      present: Boolean(envPresent("APS_TEMPLATE_OBJECT_ID") || envPresent("APS_TEMPLATE_OBJECT_PREFIX")),
      purpose: "Template DWG location in APS Object Storage"
    },
    {
      key: "APS_OUTPUT_OBJECT_PREFIX",
      present: envPresent("APS_OUTPUT_OBJECT_PREFIX"),
      purpose: "Object storage prefix for generated PDF/DWG files"
    }
  ];
}

function canSubmitToAps(readiness) {
  return readiness.every((item) => item.present);
}

function buildApsArtifacts(payload, requestId, accessToken) {
  const drawingNumber = normalizeText(payload?.sheet?.drawing_number);
  const outputPackage = normalizeText(payload?.sheet?.output_package);
  const targets = packageTargets(outputPackage);
  const drawingSlug = slugify(drawingNumber);
  const templateSlug = slugify(payload.template);

  const templateObjectId = normalizeText(process.env.APS_TEMPLATE_OBJECT_ID)
    || asObjectId(
      normalizeText(process.env.APS_TEMPLATE_OBJECT_PREFIX) || "urn:adsk.objects:os.object:fenceflow-cad-templates",
      `${templateSlug}.dwg`
    );

  const outputPrefix = normalizeText(process.env.APS_OUTPUT_OBJECT_PREFIX)
    || `urn:adsk.objects:os.object:fenceflow-generated/${requestId}`;

  const activityId = normalizeText(process.env.APS_AUTOCAD_ACTIVITY_ID) || "fenceflow.chainlink-detail+prod";
  const appBundleId = normalizeText(process.env.APS_AUTOCAD_APPBUNDLE_ID) || "fenceflow.fenceflow-cad-plugin+prod";
  const engine = normalizeText(process.env.APS_AUTOCAD_ENGINE) || "Autodesk.AutoCAD+26_0";
  const callbackUrl = normalizeText(process.env.APS_CALLBACK_URL);
  const token = accessToken || "<APS_ACCESS_TOKEN>";
  const requestDataUri = `data:application/json,${encodeURIComponent(JSON.stringify(payload))}`;

  const workitem = {
    activityId,
    arguments: {
      HostDwg: {
        verb: "get",
        url: templateObjectId,
        headers: authHeaders(token)
      },
      FenceFlowRequest: {
        verb: "get",
        url: requestDataUri,
        localName: "FenceFlowRequest.json"
      },
      ResultPdf: {
        verb: "put",
        url: asObjectId(outputPrefix, `${drawingSlug}.pdf`),
        headers: authHeaders(token)
      }
    },
    limitProcessingTimeSec: 900,
    adskMask: true
  };

  if (callbackUrl) {
    workitem.onComplete = callbackUrl;
  }

  if (targets.dwg) {
    workitem.arguments.ResultDwg = {
      verb: "put",
      url: asObjectId(outputPrefix, `${drawingSlug}.dwg`),
      headers: authHeaders(token)
    };
  }

  if (targets.previewPng) {
    workitem.arguments.ResultPreview = {
      verb: "put",
      url: asObjectId(outputPrefix, `${drawingSlug}.png`),
      headers: authHeaders(token)
    };
  }

  const activityBlueprint = {
    engine,
    appbundles: [appBundleId],
    commandLine: [
        "$(engine.path)\\accoreconsole.exe /i \"$(args[HostDwg].path)\" /al \"$(appbundles[FenceFlowCadPlugin].path)\" /s $(settings[script].path) /suppressGraphics"
    ],
    parameters: {
      HostDwg: {
        verb: "get",
        required: true,
        localName: "$(HostDwg)",
        description: "Base DWG template loaded into AutoCAD."
      },
      FenceFlowRequest: {
        verb: "get",
        required: true,
        localName: "FenceFlowRequest.json",
        description: "FenceFlow request packet used to drive the CAD template."
      },
      ResultPdf: {
        verb: "put",
        required: true,
        localName: "result.pdf",
        description: "Generated PDF sheet."
      }
    },
    settings: {
      script: {
        value: "FenceFlowGenerateSheet\n"
      }
    }
  };

  if (targets.dwg) {
    activityBlueprint.parameters.ResultDwg = {
      verb: "put",
      required: false,
      localName: "result.dwg",
      description: "Generated DWG sheet."
    };
  }

  if (targets.previewPng) {
    activityBlueprint.parameters.ResultPreview = {
      verb: "put",
      required: false,
      localName: "preview.png",
      description: "Optional preview render for browser thumbnails."
    };
  }

  return {
    aps_workitem_payload: workitem,
    aps_activity_blueprint: activityBlueprint
  };
}

async function getApsAccessToken() {
  const clientId = normalizeText(process.env.APS_CLIENT_ID);
  const clientSecret = normalizeText(process.env.APS_CLIENT_SECRET);
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "code:all data:read data:write bucket:create bucket:read"
  });

  const response = await fetch("https://developer.api.autodesk.com/authentication/v2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json"
    },
    body
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (_error) {
    data = { raw: text };
  }

  if (!response.ok) {
    const detail = data?.developerMessage || data?.error_description || data?.raw || "Unknown APS auth error.";
    throw new Error(`APS authentication failed: ${detail}`);
  }

  return data;
}

async function submitApsWorkitem(accessToken, workitemPayload) {
  const region = normalizeText(process.env.APS_DA_REGION) || "us-east";
  const baseUrl = normalizeText(process.env.APS_DA_BASE_URL) || `https://developer.api.autodesk.com/da/${region}/v3`;
  const endpoint = `${baseUrl}/workitems`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(workitemPayload)
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (_error) {
    data = { raw: text };
  }

  if (!response.ok) {
    const detail = data?.developerMessage || data?.diagnostic || data?.raw || "Unknown APS workitem error.";
    throw new Error(`APS workitem submission failed: ${detail}`);
  }

  return {
    endpoint,
    data
  };
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== "POST") {
    return json(405, {
      ok: false,
      error: "method_not_allowed",
      message: "Use POST for CAD drawing requests."
    });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (_error) {
    return json(400, {
      ok: false,
      error: "invalid_json",
      message: "Request body must be valid JSON."
    });
  }

  const requestType = normalizeText(payload.request_type);
  const template = normalizeText(payload.template);
  const drawingNumber = normalizeText(payload?.sheet?.drawing_number);
  const projectName = normalizeText(payload?.project?.name);

  if (!requestType || !template || !drawingNumber || !projectName) {
    return json(422, {
      ok: false,
      error: "missing_fields",
      message: "Required CAD request fields are missing.",
      required: [
        "request_type",
        "template",
        "sheet.drawing_number",
        "project.name"
      ]
    });
  }

  const requestId = `ff-cad-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const readiness = getApsReadiness();
  const readyForRealSubmission = canSubmitToAps(readiness);

  try {
    let apsToken = null;
    if (readyForRealSubmission) {
      apsToken = await getApsAccessToken();
    }

    const apsArtifacts = buildApsArtifacts(payload, requestId, apsToken?.access_token);
    const previewPayload = sanitizeWorkitemPayload(apsArtifacts.aps_workitem_payload);
    let submission = null;

    if (readyForRealSubmission) {
      submission = await submitApsWorkitem(apsToken.access_token, apsArtifacts.aps_workitem_payload);
    }

    return json(202, {
      ok: true,
      simulated: !readyForRealSubmission,
      request_id: requestId,
      accepted_at: now,
      status: readyForRealSubmission ? "submitted" : "queued",
      queue_target: "aps-autocad-template",
      message: readyForRealSubmission
        ? "CAD request submitted to Autodesk Platform Services Design Automation."
        : "CAD request accepted by the FenceFlow stub queue. Add the APS environment variables to enable real Autodesk submission.",
      request_summary: {
        drawing_number: drawingNumber,
        request_type: requestType,
        template,
        output_package: normalizeText(payload?.sheet?.output_package),
        project_name: projectName,
        client: normalizeText(payload?.project?.client),
        site_location: normalizeText(payload?.project?.site_location)
      },
      next_step: readyForRealSubmission
        ? {
            backend: "Monitor the APS workitem and map completed output URLs back into FenceFlow.",
            action: "Add callback/report polling plus downloadable PDF/DWG links."
          }
        : {
            backend: "Connect APS credentials and object storage configuration.",
            action: "Set the required environment variables, then re-run this request."
          },
      aps_workitem_payload: previewPayload,
      aps_activity_blueprint: apsArtifacts.aps_activity_blueprint,
      aps_requirements: readiness,
      aps_submission: submission ? {
        endpoint: submission.endpoint,
        workitem_id: submission.data.id || submission.data.workItemId || null,
        report_url: submission.data.reportUrl || null,
        status: submission.data.status || "submitted",
        raw_response: submission.data
      } : null
    });
  } catch (error) {
    return json(502, {
      ok: false,
      error: "aps_submission_failed",
      message: error.message,
      aps_requirements: readiness
    });
  }
};
