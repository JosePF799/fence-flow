using System.Collections.Generic;
using System.IO;
using Newtonsoft.Json;

namespace FenceFlowCadPlugin.Models
{
    public class FenceFlowRequest
    {
        [JsonProperty("request_type")]
        public string? RequestType { get; set; }

        [JsonProperty("backend_target")]
        public string? BackendTarget { get; set; }

        [JsonProperty("template")]
        public string? Template { get; set; }

        [JsonProperty("revision")]
        public string? Revision { get; set; }

        [JsonProperty("issue_date")]
        public string? IssueDate { get; set; }

        [JsonProperty("sheet")]
        public SheetInfo? Sheet { get; set; }

        [JsonProperty("project")]
        public ProjectInfo? Project { get; set; }

        [JsonProperty("fence")]
        public FenceInfo? Fence { get; set; }

        [JsonProperty("notes")]
        public List<string> Notes { get; set; } = new List<string>();

        public static FenceFlowRequest Load(string path)
        {
            var json = File.ReadAllText(path);
            return JsonConvert.DeserializeObject<FenceFlowRequest>(json) ?? new FenceFlowRequest();
        }
    }

    public class SheetInfo
    {
        [JsonProperty("size")]
        public string? Size { get; set; }

        [JsonProperty("output_package")]
        public string? OutputPackage { get; set; }

        [JsonProperty("drawing_number")]
        public string? DrawingNumber { get; set; }
    }

    public class ProjectInfo
    {
        [JsonProperty("name")]
        public string? Name { get; set; }

        [JsonProperty("client")]
        public string? Client { get; set; }

        [JsonProperty("site_location")]
        public string? SiteLocation { get; set; }
    }

    public class FenceInfo
    {
        [JsonProperty("height")]
        public string? Height { get; set; }

        [JsonProperty("typical_bay_width_ft")]
        public double TypicalBayWidthFt { get; set; }

        [JsonProperty("drawing_type")]
        public string? DrawingType { get; set; }

        [JsonProperty("line_post_size")]
        public string? LinePostSize { get; set; }

        [JsonProperty("terminal_post_size")]
        public string? TerminalPostSize { get; set; }

        [JsonProperty("top_treatment")]
        public string? TopTreatment { get; set; }

        [JsonProperty("middle_rail")]
        public string? MiddleRail { get; set; }

        [JsonProperty("bottom_edge")]
        public string? BottomEdge { get; set; }

        [JsonProperty("security")]
        public string? Security { get; set; }
    }
}
