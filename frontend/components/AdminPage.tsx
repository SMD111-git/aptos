import React, { useEffect, useState } from "react";

type UploadFile = {
  name: string;
  type?: string;
  size?: number;
  dataBase64: string; // data as base64 string
};

type StudentDetails = {
  name: string;
  roll: string;
  email?: string;
  program?: string;
  semester?: string;
  year?: string;
};

type UploadEntry = {
  id: string;
  createdAt: number;
  student: StudentDetails;
  documents: UploadFile[]; // other documents
  marksheets: UploadFile[]; // semester mark sheets
};

const ACCOUNT_KEY = "myapp_account";
const UPLOADS_KEY = "myapp_uploads";

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // result is like "data:...;base64,AAAA..."
      const base64 = result.split(",")[1] ?? "";
      res(base64);
    };
    reader.onerror = () => rej(new Error("File read error"));
    reader.readAsDataURL(file);
  });
}

export default function AdminPage(): JSX.Element {
  const [account, setAccount] = useState<any | null>(null);
  const [canUpload, setCanUpload] = useState(false);

  const [student, setStudent] = useState<StudentDetails>({
    name: "",
    roll: "",
    email: "",
    program: "",
    semester: "",
    year: "",
  });

  const [docFiles, setDocFiles] = useState<FileList | null>(null);
  const [marksFiles, setMarksFiles] = useState<FileList | null>(null);

  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // load account from localStorage
    try {
      const raw = localStorage.getItem(ACCOUNT_KEY);
      if (raw) {
        const acc = JSON.parse(raw);
        setAccount(acc);
        setCanUpload(Boolean(acc?.canUpload));
      }
    } catch {}
    // load existing uploads
    try {
      const raw = localStorage.getItem(UPLOADS_KEY);
      if (raw) setUploads(JSON.parse(raw));
    } catch {}
    // listen for account changes from Login component
    const handler = (e: any) => {
      const acc = e?.detail ?? null;
      setAccount(acc);
      setCanUpload(Boolean(acc?.canUpload));
    };
    window.addEventListener("myapp:account", handler as EventListener);
    return () => window.removeEventListener("myapp:account", handler as EventListener);
  }, []);

  function persistUploads(next: UploadEntry[]) {
    setUploads(next);
    try {
      localStorage.setItem(UPLOADS_KEY, JSON.stringify(next));
    } catch {}
  }

  function enableUploadMock() {
    // development helper: enable upload on stored account
    try {
      const raw = localStorage.getItem(ACCOUNT_KEY);
      if (!raw) return setMessage("No account in storage to enable.");
      const acc = JSON.parse(raw);
      acc.canUpload = true;
      localStorage.setItem(ACCOUNT_KEY, JSON.stringify(acc));
      window.dispatchEvent(new CustomEvent("myapp:account", { detail: acc }));
      setAccount(acc);
      setCanUpload(true);
      setMessage("Upload enabled for this account (mock).");
    } catch {
      setMessage("Failed to enable upload (storage error).");
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setMessage(null);
    if (!canUpload) {
      setMessage("You do not have permission to upload. Contact admin.");
      return;
    }
    if (!student.name || !student.roll) {
      setMessage("Student name and roll are required.");
      return;
    }

    setLoading(true);
    try {
      const docs: UploadFile[] = [];
      const marks: UploadFile[] = [];

      if (docFiles && docFiles.length > 0) {
        for (let i = 0; i < docFiles.length; i++) {
          const f = docFiles[i];
          const b64 = await fileToBase64(f);
          docs.push({ name: f.name, type: f.type, size: f.size, dataBase64: b64 });
        }
      }

      if (marksFiles && marksFiles.length > 0) {
        for (let i = 0; i < marksFiles.length; i++) {
          const f = marksFiles[i];
          const b64 = await fileToBase64(f);
          marks.push({ name: f.name, type: f.type, size: f.size, dataBase64: b64 });
        }
      }

      const entry: UploadEntry = {
        id: genId(),
        createdAt: Date.now(),
        student: { ...student },
        documents: docs,
        marksheets: marks,
      };

      const next = [entry, ...uploads];
      persistUploads(next);

      // broadcast that an upload occurred
      try {
        window.dispatchEvent(new CustomEvent("myapp:upload", { detail: entry }));
      } catch {}

      setMessage("Upload saved locally. (TODO: send to backend)");
      // clear form
      setStudent({ name: "", roll: "", email: "", program: "", semester: "", year: "" });
      setDocFiles(null);
      setMarksFiles(null);
      // reset file inputs in DOM (if present)
      const df = document.getElementById("docs-input") as HTMLInputElement | null;
      const mf = document.getElementById("marks-input") as HTMLInputElement | null;
      if (df) df.value = "";
      if (mf) mf.value = "";
    } catch (err) {
      setMessage("Failed to read files.");
    } finally {
      setLoading(false);
    }
  }

  function downloadBase64File(file: UploadFile) {
    const byteChars = atob(file.dataBase64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: file.type || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function removeEntry(id: string) {
    const next = uploads.filter((u) => u.id !== id);
    persistUploads(next);
    setMessage("Entry deleted.");
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="bg-white border border-blue-100 rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-center text-blue-700 mb-2">College Admin — Student Uploads</h2>
        <p className="text-center text-sm text-blue-600 mb-4">
          Use this page to add student details and attach documents / semester mark sheets.
        </p>

        {!account && (
          <div className="text-center p-4 bg-blue-50 border border-blue-100 rounded mb-4">
            <div className="mb-2">No account detected. Please sign in first.</div>
            <div className="text-xs text-gray-600">Open Login and connect a wallet or sign in with email.</div>
          </div>
        )}

        {account && (
          <div className="mb-6 border border-blue-100 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {account.name ? account.name.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-blue-900">{account.name || "Admin"}</div>
                <div className="text-xs text-gray-500">
                  {account.method === "wallet" ? account.address : account.email}
                </div>
              </div>
              <div className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                ADMIN
              </div>
            </div>
          </div>
        )}

        {account && !canUpload && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-100 rounded text-center">
            <div className="mb-2 font-medium">Upload access is currently disabled for your account.</div>
            <div className="text-xs text-gray-600 mb-3">Only college admin accounts may upload student records.</div>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setMessage("Request sent to admin (mock)")}
                className="px-3 py-2 bg-blue-600 text-white rounded text-sm"
              >
                Request access
              </button>
              <button onClick={enableUploadMock} className="px-3 py-2 bg-white border rounded text-sm">
                Enable upload (dev)
              </button>
            </div>
          </div>
        )}

        {/* upload form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={student.name}
              onChange={(e) => setStudent({ ...student, name: e.target.value })}
              placeholder="Student full name"
              className="px-3 py-2 border rounded"
              required
            />
            <input
              value={student.roll}
              onChange={(e) => setStudent({ ...student, roll: e.target.value })}
              placeholder="College roll / ID"
              className="px-3 py-2 border rounded"
              required
            />
            <input
              value={student.email}
              onChange={(e) => setStudent({ ...student, email: e.target.value })}
              placeholder="Email (optional)"
              className="px-3 py-2 border rounded"
            />
            <input
              value={student.program}
              onChange={(e) => setStudent({ ...student, program: e.target.value })}
              placeholder="Program (e.g., B.Tech, MSc)"
              className="px-3 py-2 border rounded"
            />
            <input
              value={student.semester}
              onChange={(e) => setStudent({ ...student, semester: e.target.value })}
              placeholder="Semester (e.g., 4)"
              className="px-3 py-2 border rounded"
            />
            <input
              value={student.year}
              onChange={(e) => setStudent({ ...student, year: e.target.value })}
              placeholder="Year"
              className="px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Documents (ID, certificates) — multiple</label>
            <input
              id="docs-input"
              type="file"
              multiple
              onChange={(e) => setDocFiles(e.target.files)}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">Allowed: PDFs, images. Files are stored locally in browser (demo).</div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Semester marksheets — multiple</label>
            <input
              id="marks-input"
              type="file"
              multiple
              onChange={(e) => setMarksFiles(e.target.files)}
              className="w-full"
            />
          </div>

          <div className="flex gap-2 justify-center">
            <button
              type="submit"
              disabled={loading || !canUpload}
              className={`px-4 py-2 rounded text-white ${canUpload ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"}`}
            >
              {loading ? "Saving…" : "Save student record"}
            </button>
            <button
              type="button"
              onClick={() =>
                setStudent({ name: "", roll: "", email: "", program: "", semester: "", year: "" })
              }
              className="px-4 py-2 rounded border"
            >
              Clear
            </button>
          </div>
        </form>

        {message && <div className="mt-4 text-center text-sm text-gray-700">{message}</div>}

        {/* uploads list */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-blue-700 mb-2">Saved uploads</h3>
          {uploads.length === 0 ? (
            <div className="text-sm text-gray-500">No uploads yet.</div>
          ) : (
            <div className="space-y-3">
              {uploads.map((u) => (
                <div key={u.id} className="border rounded p-3 bg-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{u.student.name} — {u.student.roll}</div>
                      <div className="text-xs text-gray-500">{new Date(u.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => removeEntry(u.id)}
                        className="px-2 py-1 text-xs bg-red-50 border text-red-700 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <div className="text-sm font-medium mb-1">Documents</div>
                      {u.documents.length === 0 ? (
                        <div className="text-xs text-gray-500">—</div>
                      ) : (
                        <ul className="space-y-1">
                          {u.documents.map((f, i) => (
                            <li key={i} className="text-sm flex items-center justify-between">
                              <span className="truncate">{f.name}</span>
                              <div className="flex gap-2">
                                <button onClick={() => downloadBase64File(f)} className="text-xs px-2 py-1 border rounded">Download</button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-1">Mark sheets</div>
                      {u.marksheets.length === 0 ? (
                        <div className="text-xs text-gray-500">—</div>
                      ) : (
                        <ul className="space-y-1">
                          {u.marksheets.map((f, i) => (
                            <li key={i} className="text-sm flex items-center justify-between">
                              <span className="truncate">{f.name}</span>
                              <div>
                                <button onClick={() => downloadBase64File(f)} className="text-xs px-2 py-1 border rounded">Download</button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 text-xs text-gray-500">
          Note: files are stored locally in your browser for this demo. Replace the client-side storage with a secure backend and proper authentication for production.
        </div>
      </div>
    </div>
  );
}
