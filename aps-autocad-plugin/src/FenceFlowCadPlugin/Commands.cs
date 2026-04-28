using System;
using System.IO;
using Autodesk.AutoCAD.ApplicationServices.Core;
using Autodesk.AutoCAD.DatabaseServices;
using Autodesk.AutoCAD.EditorInput;
using Autodesk.AutoCAD.Geometry;
using Autodesk.AutoCAD.Runtime;
using FenceFlowCadPlugin.Models;

[assembly: CommandClass(typeof(FenceFlowCadPlugin.Commands))]

namespace FenceFlowCadPlugin
{
    public class Commands
    {
        [CommandMethod("FenceFlowSmokeTest")]
        public void FenceFlowSmokeTest()
        {
            var document = Application.DocumentManager.MdiActiveDocument;
            var editor = document.Editor;
            editor.WriteMessage("\nFenceFlow CAD plugin loaded.");
        }

        [CommandMethod("FenceFlowGenerateSheet")]
        public void FenceFlowGenerateSheet()
        {
            var document = Application.DocumentManager.MdiActiveDocument;
            var editor = document.Editor;

            try
            {
                var workingFolder = GetWorkingFolder(document);
                var requestPath = Path.Combine(workingFolder, "FenceFlowRequest.json");

                if (!File.Exists(requestPath))
                {
                    throw new FileNotFoundException("FenceFlowRequest.json was not found in the AutoCAD working folder.", requestPath);
                }

                var request = FenceFlowRequest.Load(requestPath);
                WriteRequestSummary(document.Database, request);
                SaveResultDwg(document.Database, workingFolder);
                WriteDebugFile(workingFolder, request);

                editor.WriteMessage($"\nFenceFlow request loaded for {request.Project?.Name ?? "Untitled project"}.");
                editor.WriteMessage("\nFenceFlow scaffold completed: result.dwg + debug file written.");

                // TODO: Replace this scaffold behavior with the real generation workflow:
                // 1. Update title block attributes from request.Project / request.Sheet / request.Revision
                // 2. Draw or swap realistic fence detail blocks based on request.Fence
                // 3. Generate a real result.pdf from paper space
                // 4. Save optional result.dwg when requested
            }
            catch (System.Exception ex)
            {
                editor.WriteMessage($"\nFenceFlowGenerateSheet failed: {ex.Message}");
                throw;
            }
        }

        private static string GetWorkingFolder(Document document)
        {
            var docPath = document?.Name ?? string.Empty;
            var folder = Path.GetDirectoryName(docPath);
            return string.IsNullOrWhiteSpace(folder)
                ? Environment.CurrentDirectory
                : folder;
        }

        private static void SaveResultDwg(Database database, string workingFolder)
        {
            var resultPath = Path.Combine(workingFolder, "result.dwg");
            database.SaveAs(resultPath, true, DwgVersion.Current, database.SecurityParameters);
        }

        private static void WriteRequestSummary(Database database, FenceFlowRequest request)
        {
            using (var transaction = database.TransactionManager.StartTransaction())
            {
                var blockTable = (BlockTable)transaction.GetObject(database.BlockTableId, OpenMode.ForRead);
                var paperSpace = (BlockTableRecord)transaction.GetObject(blockTable[BlockTableRecord.PaperSpace], OpenMode.ForWrite);

                var note = new MText
                {
                    Location = new Point3d(1.0, 8.5, 0.0),
                    TextHeight = 0.18,
                    Width = 6.5,
                    Attachment = AttachmentPoint.TopLeft,
                    Contents =
                        $"FENCEFLOW CAD SCAFFOLD\\P" +
                        $"Project: {Escape(request.Project?.Name)}\\P" +
                        $"Client: {Escape(request.Project?.Client)}\\P" +
                        $"Site: {Escape(request.Project?.SiteLocation)}\\P" +
                        $"Drawing #: {Escape(request.Sheet?.DrawingNumber)}\\P" +
                        $"Revision: {Escape(request.Revision)}\\P" +
                        $"Fence Height: {Escape(request.Fence?.Height)}\\P" +
                        $"Top: {Escape(request.Fence?.TopTreatment)}\\P" +
                        $"Middle: {Escape(request.Fence?.MiddleRail)}\\P" +
                        $"Bottom: {Escape(request.Fence?.BottomEdge)}\\P" +
                        $"Security: {Escape(request.Fence?.Security)}"
                };

                paperSpace.AppendEntity(note);
                transaction.AddNewlyCreatedDBObject(note, true);
                transaction.Commit();
            }
        }

        private static void WriteDebugFile(string workingFolder, FenceFlowRequest request)
        {
            var debugPath = Path.Combine(workingFolder, "FenceFlowDebug.txt");
            var lines = new[]
            {
                "FenceFlow APS plugin scaffold",
                $"Generated: {DateTime.UtcNow:O}",
                $"Project: {request.Project?.Name}",
                $"Client: {request.Project?.Client}",
                $"Site: {request.Project?.SiteLocation}",
                $"Drawing Number: {request.Sheet?.DrawingNumber}",
                $"Output Package: {request.Sheet?.OutputPackage}",
                $"Template: {request.Template}",
                $"Fence Height: {request.Fence?.Height}",
                $"Line Post: {request.Fence?.LinePostSize}",
                $"Terminal Post: {request.Fence?.TerminalPostSize}",
                $"Top Treatment: {request.Fence?.TopTreatment}",
                $"Middle Rail: {request.Fence?.MiddleRail}",
                $"Bottom Edge: {request.Fence?.BottomEdge}",
                $"Security: {request.Fence?.Security}"
            };

            File.WriteAllLines(debugPath, lines);
        }

        private static string Escape(string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? "-"
                : value.Replace("\\", "\\\\");
        }
    }
}
