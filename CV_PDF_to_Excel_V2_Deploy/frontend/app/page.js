"use client";

import { useMemo, useState } from "react";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

const EDITABLE_FIELDS = [
  ["cv_number", "CV No."],
  ["cv_date", "CV Date"],
  ["machine_number", "Machine Number"],
  ["capacity", "Capacity"],
  ["class", "Class"],
  ["customer_name", "Customer Name"],
  ["location", "Location"],
  ["actual_stamping_fee", "Actual Stamping Fee"],
  ["site_stamping_fee", "Site Stamping Fee"],
  ["od_charges", "OD Charges"],
];

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

async function readError(response) {
  try {
    const body = await response.json();
    return body?.detail || "Request failed.";
  } catch {
    return `Request failed (${response.status}).`;
  }
}

function flattenFiles(filesResponse) {
  return filesResponse.flatMap((file) =>
    file.certificates.map((certificate) => ({
      ...certificate,
      _source_pdf: file.filename,
      _certificate_index: certificate._certificate_index,
    }))
  );
}

export default function Home() {
  const [files, setFiles] = useState([]);
  const [records, setRecords] = useState([]);
  const [hasPreview, setHasPreview] = useState(false);
  const [service, setService] = useState("500");
  const [cc, setCc] = useState("100");
  const [outputMode, setOutputMode] = useState("combined");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const issueCount = useMemo(
    () => records.filter((record) => record.review_required).length,
    [records]
  );

  function setSelectedFiles(nextFiles) {
    setFiles(Array.from(nextFiles || []).filter((file) =>
      file.name.toLowerCase().endsWith(".pdf")
    ));
    setRecords([]);
    setHasPreview(false);
    setMessage("");
  }

  function updateRecord(index, field, value) {
    setRecords((current) =>
      current.map((record, recordIndex) => {
        if (recordIndex !== index) return record;

        const next = { ...record, [field]: value };

        if (field === "actual_stamping_fee" || field === "site_stamping_fee" || field === "od_charges") {
          next[field] = value === "" ? null : Number(value);
          if (Number.isNaN(next[field])) next[field] = null;
        }

        const requiredValues = [
          next.cv_number,
          next.cv_date,
          next.machine_number,
          next.capacity,
          next.class,
          next.customer_name,
          next.actual_stamping_fee,
        ];
        next.review_required = requiredValues.some((value) => value === "" || value === null || value === undefined);
        next.warnings = [];
        if (!next.cv_number) next.warnings.push("Missing CV Number");
        if (!next.cv_date) next.warnings.push("Missing CV Date");
        if (!next.machine_number) next.warnings.push("Missing Machine Number");
        if (!next.capacity) next.warnings.push("Missing Capacity");
        if (!next.class) next.warnings.push("Missing Class");
        if (!next.customer_name) next.warnings.push("Missing Customer Name");
        if (next.actual_stamping_fee === null || next.actual_stamping_fee === undefined) {
          next.warnings.push("Missing Stamping Fee");
        }

        return next;
      })
    );
  }

  async function preview() {
    if (!files.length) return;

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const response = await fetch(`${API}/extract`, {
        method: "POST",
        headers: password ? { "X-App-Password": password } : {},
        body: formData,
      });

      if (!response.ok) throw new Error(await readError(response));

      const result = await response.json();
      setRecords(flattenFiles(result.files || []));
      setHasPreview(true);
      setMessage("Extraction complete. Review any flagged rows before generating.");
    } catch (error) {
      setMessage(error.message || "Could not extract the PDFs.");
    } finally {
      setLoading(false);
    }
  }

  async function generate() {
    if (!files.length || !records.length) {
      setMessage("Preview the PDFs first, then generate the Excel.");
      return;
    }

    if (issueCount > 0) {
      setMessage(`Please correct ${issueCount} flagged row(s) before generating.`);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("service_charge", service);
      formData.append("cc_tada_per_pdf", cc);
      formData.append("output_mode", outputMode);
      formData.append("records_json", JSON.stringify(records));

      const response = await fetch(`${API}/generate`, {
        method: "POST",
        headers: password ? { "X-App-Password": password } : {},
        body: formData,
      });

      if (!response.ok) throw new Error(await readError(response));

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        outputMode === "combined"
          ? "Generated_Annexure_XXI.xlsx"
          : "Generated_Annexure_XXI_by_PDF.zip";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage("File generated successfully.");
    } catch (error) {
      setMessage(error.message || "Could not generate the Excel file.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <div className="eyebrow"><span className="dot" />LEGAL METROLOGY</div>
          <h1>Annexure <span className="grad">Convertor</span></h1>
          <p className="sub">
            Upload verification certificates, review extracted records, and
            generate the Annexure-XXI stamping service sheet.
          </p>
        </div>
        <div className="badge"><span className="pulse" />V2</div>
      </section>

      <section className="card">
        <div
          className={`dropzone ${dragActive ? "active" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            setSelectedFiles(event.dataTransfer.files);
          }}
        >
          <input
            id="pdf-input"
            type="file"
            accept=".pdf"
            multiple
            onChange={(event) => setSelectedFiles(event.target.files)}
          />
          <label htmlFor="pdf-input">
            <span className="dropIcon">↑</span>
            <strong>Drop PDF files here</strong>
            <span className="dropHint">or click to select one or multiple PDFs</span>
          </label>
        </div>

        {files.length > 0 && (
          <div className="fileList">
            {files.map((file) => (
              <div className="fileRow" style={{ animationDelay: `${Math.min(files.indexOf(file), 10) * 50}ms` }} key={`${file.name}-${file.size}-${file.lastModified}`}>
                <span>✓ {file.name}</span>
                <span>{Math.round(file.size / 1024)} KB</span>
              </div>
            ))}
          </div>
        )}

        <div className="settingsGrid">
          <label>
            Location
            <input value="HOSUR" readOnly />
          </label>
          <label>
            Service charge / certificate
            <input
              type="number"
              min="0"
              value={service}
              onChange={(event) => setService(event.target.value)}
            />
          </label>
          <label>
            CC / TA-DA / uploaded PDF
            <input
              type="number"
              min="0"
              value={cc}
              onChange={(event) => setCc(event.target.value)}
            />
          </label>
          <label>
            Output
            <select
              value={outputMode}
              onChange={(event) => setOutputMode(event.target.value)}
            >
              <option value="combined">One combined Excel</option>
              <option value="separate">One Excel per PDF (ZIP)</option>
            </select>
          </label>
          <label>
            App password
            <input
              type="password"
              placeholder="Only required when enabled on Render"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
        </div>

        <div className="rules">
          <span>✓ 50% fee only when the PDF explicitly has “50% Additional Fee”</span>
          <span>✓ CC / TA-DA is added once per uploaded PDF</span>
          <span>✓ Service charge defaults to ₹500 per certificate</span>
          <span>✓ OD is blank when zero / absent</span>
        </div>

        <div className="actions">
          <button onClick={preview} disabled={!files.length || loading}>
            {loading && <span className="spinner" />}{loading ? "Processing…" : "1. Preview & Extract"}
          </button>
          <button
            className="primary"
            onClick={generate}
            disabled={!hasPreview || !records.length || loading}
          >
            {loading && <span className="spinner" />}{loading ? "Processing…" : "2. Generate Excel"}
          </button>
          <button
            className="quiet"
            onClick={() => {
              setFiles([]);
              setRecords([]);
              setHasPreview(false);
              setMessage("");
            }}
            disabled={loading}
          >
            Clear
          </button>
        </div>

        {message && <div className="message">{message}</div>}
      </section>

      {hasPreview && (
        <section className="card">
          <div className="sectionHead">
            <div>
              <h2>Review extracted data</h2>
              <p>Edit any cell before creating the final workbook.</p>
            </div>
            <div className={`count ${issueCount ? "warn" : ""}`}>
              {records.length} certificates
              {issueCount ? ` · ${issueCount} need review` : " · ready"}
            </div>
          </div>

          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Source PDF</th>
                  <th>CV No.</th>
                  <th>Date</th>
                  <th>Machine No.</th>
                  <th>Capacity</th>
                  <th>Class</th>
                  <th>Customer</th>
                  <th>Stamping</th>
                  <th>50% Additional</th>
                  <th>OD</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr key={`${record._source_pdf}-${index}`} style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }} className={record.review_required ? "needsReview" : ""}>
                    <td>{index + 1}</td>
                    <td className="source">{record._source_pdf}</td>

                    {EDITABLE_FIELDS.map(([field, label]) => (
                      <td key={field}>
                        <input
                          aria-label={`${label} row ${index + 1}`}
                          type={
                            field === "actual_stamping_fee" ||
                            field === "site_stamping_fee" ||
                            field === "od_charges"
                              ? "number"
                              : "text"
                          }
                          min={
                            field === "actual_stamping_fee" ||
                            field === "site_stamping_fee" ||
                            field === "od_charges"
                              ? "0"
                              : undefined
                          }
                          value={
                            field === "site_stamping_fee" || field === "od_charges"
                              ? formatMoney(record[field])
                              : record[field] ?? ""
                          }
                          onChange={(event) =>
                            updateRecord(index, field, event.target.value)
                          }
                        />
                      </td>
                    ))}

                    <td>
                      {record.review_required ? (
                        <span className="status bad" title={record.warnings.join(", ")}>
                          Review
                        </span>
                      ) : (
                        <span className="status ok">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="footNote">
            <strong>Excel mapping:</strong> CV No. → VC Number, Date → VC Date,
            Machine No. → Machine Number, Max → Capacity, customer after
            “belonging to M/S” → Customer Name, HOSUR → Location, Stamping Fee
            → Actual Stamping Fees, 50% Additional Fee → Site Stamping Fees,
            OD → OD Charges.
          </div>
        </section>
      )}
    </main>
  );
}
