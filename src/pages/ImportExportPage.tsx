import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Upload, Download, FileSpreadsheet, Users, GitBranch, CheckCircle2,
  AlertTriangle, Loader2, FileText, Trash2, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

type DataType = "contacts" | "deals";

const crmSources = [
  { name: "HubSpot", icon: "🟠", format: "CSV exportado do HubSpot" },
  { name: "Salesforce", icon: "☁️", format: "CSV exportado do Salesforce" },
  { name: "Pipedrive", icon: "🟢", format: "CSV exportado do Pipedrive" },
  { name: "RD Station", icon: "🔵", format: "CSV exportado do RD Station" },
  { name: "Bitrix24", icon: "🔴", format: "CSV exportado do Bitrix24" },
  { name: "Planilha Excel/CSV", icon: "📊", format: "Arquivo .csv ou .xlsx" },
];

const contactColumns = ["name", "email", "phone", "company", "status", "channel", "score"];
const dealColumns = ["name", "value", "stage", "contact", "company", "days_in_stage"];

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map(line => {
    const vals: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === "," && !inQuotes) { vals.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    vals.push(current.trim());
    return vals;
  });
  return { headers, rows };
}

const ImportExportPage = () => {
  const [tab, setTab] = useState<"import" | "export">("import");
  const [dataType, setDataType] = useState<DataType>("contacts");
  const [selectedCRM, setSelectedCRM] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);
  const [exporting, setExporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const targetColumns = dataType === "contacts" ? contactColumns : dealColumns;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = parseCSV(text);
      setParsed(result);
      // Auto-map matching columns
      const autoMap: Record<string, string> = {};
      result.headers.forEach(h => {
        const lower = h.toLowerCase().replace(/[^a-z]/g, "");
        const match = targetColumns.find(tc => {
          const tcLower = tc.toLowerCase().replace(/[^a-z]/g, "");
          return lower.includes(tcLower) || tcLower.includes(lower);
        });
        if (match) autoMap[h] = match;
      });
      setMapping(autoMap);
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (!parsed) return;
    setImporting(true);
    setImportResult(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Faça login primeiro"); setImporting(false); return; }

    let success = 0, errors = 0;
    const batchSize = 50;
    const allRows = parsed.rows;

    for (let i = 0; i < allRows.length; i += batchSize) {
      const batch = allRows.slice(i, i + batchSize).map(row => {
        const record: Record<string, any> = { user_id: user.id };
        parsed.headers.forEach((h, idx) => {
          const targetCol = mapping[h];
          if (targetCol && row[idx]) {
            if (targetCol === "value" || targetCol === "score" || targetCol === "days_in_stage") {
              record[targetCol] = parseFloat(row[idx]) || 0;
            } else {
              record[targetCol] = row[idx];
            }
          }
        });
        // Ensure required fields
        if (dataType === "contacts" && !record.name) record.name = "Sem nome";
        if (dataType === "deals" && !record.name) record.name = "Sem nome";
        return record;
      });

      const { error } = await supabase.from(dataType).insert(batch as any);
      if (error) {
        errors += batch.length;
        console.error("Import error:", error);
      } else {
        success += batch.length;
      }
    }

    setImportResult({ success, errors });
    setImporting(false);
    if (success > 0) toast.success(`${success} registros importados com sucesso!`);
    if (errors > 0) toast.error(`${errors} registros com erro`);
  };

  const handleExport = async () => {
    setExporting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Faça login primeiro"); setExporting(false); return; }

    const { data, error } = await supabase.from(dataType).select("*").eq("user_id", user.id);
    if (error) { toast.error("Erro ao exportar dados"); setExporting(false); return; }
    if (!data || data.length === 0) { toast.info("Nenhum dado para exportar"); setExporting(false); return; }

    const cols = targetColumns;
    const csvRows = [cols.join(",")];
    data.forEach((row: any) => {
      csvRows.push(cols.map(c => {
        const val = row[c] ?? "";
        return typeof val === "string" && val.includes(",") ? `"${val}"` : String(val);
      }).join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dataType}_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`${data.length} registros exportados!`);
    setExporting(false);
  };

  const clearFile = () => {
    setFile(null);
    setParsed(null);
    setMapping({});
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold font-display text-foreground">Importar & Exportar</h1>
        <p className="text-sm text-muted-foreground mt-1">Migre dados de outros CRMs ou exporte seus dados</p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item} className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {[{ key: "import", label: "Importar", icon: Upload }, { key: "export", label: "Exportar", icon: Download }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)} className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2", tab === t.key ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground")}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </motion.div>

      {/* Data type selector */}
      <motion.div variants={item} className="flex gap-3">
        {[{ key: "contacts", label: "Contatos", icon: Users }, { key: "deals", label: "Negócios", icon: GitBranch }].map(d => (
          <button key={d.key} onClick={() => { setDataType(d.key as DataType); clearFile(); }} className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors", dataType === d.key ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground")}>
            <d.icon className="h-4 w-4" />{d.label}
          </button>
        ))}
      </motion.div>

      {/* IMPORT TAB */}
      {tab === "import" && (
        <div className="space-y-5">
          {/* CRM source */}
          {!file && (
            <motion.div variants={item} className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">De onde vêm os dados?</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {crmSources.map(crm => (
                  <button key={crm.name} onClick={() => setSelectedCRM(crm.name)} className={cn("flex items-center gap-3 p-4 rounded-xl border text-left transition-colors", selectedCRM === crm.name ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/50")}>
                    <span className="text-2xl">{crm.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{crm.name}</p>
                      <p className="text-[11px] text-muted-foreground">{crm.format}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* File upload */}
          <motion.div variants={item} className="space-y-3">
            {!file ? (
              <div
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-border bg-muted/20 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Clique para selecionar um arquivo CSV</p>
                  <p className="text-xs text-muted-foreground mt-1">Formatos aceitos: .csv (separado por vírgulas)</p>
                </div>
                <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{parsed?.rows.length || 0} registros encontrados · {parsed?.headers.length || 0} colunas</p>
                </div>
                <button onClick={clearFile} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
              </div>
            )}
          </motion.div>

          {/* Column mapping */}
          {parsed && (
            <motion.div variants={item} className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Mapeamento de colunas</h3>
              <p className="text-xs text-muted-foreground">Associe as colunas do seu arquivo aos campos do OmniCRM</p>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-2.5">Coluna do Arquivo</th>
                      <th className="px-4 py-2.5"><ArrowRight className="h-3 w-3 text-muted-foreground mx-auto" /></th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-2.5">Campo OmniCRM</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-4 py-2.5">Exemplo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.headers.map((h, idx) => (
                      <tr key={h} className="border-b border-border last:border-0">
                        <td className="px-4 py-2.5 text-sm text-foreground font-medium">{h}</td>
                        <td className="px-4 py-2.5 text-center"><ArrowRight className="h-3 w-3 text-muted-foreground mx-auto" /></td>
                        <td className="px-4 py-2.5">
                          <select
                            value={mapping[h] || ""}
                            onChange={e => setMapping(prev => ({ ...prev, [h]: e.target.value }))}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground"
                          >
                            <option value="">— Ignorar —</option>
                            {targetColumns.map(col => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground truncate max-w-[150px]">
                          {parsed.rows[0]?.[idx] || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Import result */}
          {importResult && (
            <motion.div variants={item} className={cn("flex items-center gap-3 p-4 rounded-xl border", importResult.errors > 0 ? "border-accent bg-accent/5" : "border-secondary bg-secondary/5")}>
              {importResult.errors > 0 ? <AlertTriangle className="h-5 w-5 text-accent-foreground" /> : <CheckCircle2 className="h-5 w-5 text-secondary" />}
              <div>
                <p className="text-sm font-medium text-foreground">{importResult.success} registros importados com sucesso</p>
                {importResult.errors > 0 && <p className="text-xs text-destructive">{importResult.errors} registros com erro</p>}
              </div>
            </motion.div>
          )}

          {/* Import button */}
          {parsed && !importResult && (
            <motion.div variants={item}>
              <button
                onClick={handleImport}
                disabled={importing || Object.values(mapping).filter(Boolean).length === 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {importing ? "Importando..." : `Importar ${parsed.rows.length} registros`}
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* EXPORT TAB */}
      {tab === "export" && (
        <motion.div variants={item} className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4 max-w-lg">
            <div className="flex items-center gap-3">
              <Download className="h-6 w-6 text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">Exportar {dataType === "contacts" ? "Contatos" : "Negócios"}</h3>
                <p className="text-xs text-muted-foreground">Gera um arquivo CSV com todos os seus {dataType === "contacts" ? "contatos" : "negócios"}</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>📄 Formato: CSV (compatível com Excel, Google Sheets)</p>
              <p>📋 Colunas: {targetColumns.join(", ")}</p>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {exporting ? "Exportando..." : "Exportar CSV"}
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ImportExportPage;
