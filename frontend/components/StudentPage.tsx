import React, { useEffect, useState } from "react";

type StudentRecord = {
  id: string;
  student: {
    name: string;
    roll: string;
    email?: string;
    program?: string;
    semester?: string;
    year?: string;
  };
  documents: Array<{ name: string; dataBase64: string }>;
  marksheets: Array<{ name: string; dataBase64: string }>;
  createdAt: number;
};

const ACCOUNT_KEY = "myapp_account";
const UPLOADS_KEY = "myapp_uploads";

export default function StudentPage(): JSX.Element {
  const [account, setAccount] = useState<any | null>(null);
  const [myRecords, setMyRecords] = useState<StudentRecord[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ACCOUNT_KEY);
      if (raw) setAccount(JSON.parse(raw));
    } catch {}

    // listen for account changes
    const handler = (e: any) => {
      setAccount(e?.detail ?? null);
    };
    window.addEventListener("myapp:account", handler as EventListener);
    return () => window.removeEventListener("myapp:account", handler as EventListener);
  }, []);

  useEffect(() => {
    // load records that belong to this student (mock: match by address or email)
    try {
      const raw = localStorage.getItem(UPLOADS_KEY);
      if (!raw) return;
      const all: StudentRecord[] = JSON.parse(raw);
      // for demo: if logged in as student, show records matching their email or address (mock)
      const identifier = account?.method === "wallet" ? account.address : account?.email;
      if (!identifier) return;
      // in a real app, the backend would filter by authenticated user
      // for this demo, we'll just show all records (no filtering)
      setMyRecords(all);
    } catch {}
  }, [account]);

  function downloadBase64File(file: { name: string; dataBase64: string }) {
    const byteChars = atob(file.dataBase64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white border border-blue-100 rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-center text-blue-700 mb-2">Student Dashboard</h2>
        <p className="text-center text-sm text-blue-600 mb-4">
          View your profile, documents, and semester marksheets uploaded by your college admin.
        </p>

        {!account && (
          <div className="text-center p-4 bg-blue-50 border border-blue-100 rounded mb-4">
            <div className="mb-2">No account detected. Please sign in as a student.</div>
          </div>
        )}

        {account && account.role !== "student" && (
          <div className="text-center p-4 bg-yellow-50 border border-yellow-100 rounded mb-4">
            You are signed in as <strong>{account.role}</strong>. This page is for students only.
          </div>
        )}

        {account && account.role === "student" && (
          <div className="mb-6">
            <div className="border border-blue-100 rounded p-4 bg-blue-50">
              <div className="text-sm font-medium mb-1">Your Account</div>
              <div className="text-sm text-gray-700">
                {account.method === "wallet" ? `Wallet: ${account.address}` : `Email: ${account.email}`}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-lg font-medium text-blue-700 mb-2">Your Records</h3>
          {myRecords.length === 0 ? (
            <div className="text-sm text-gray-500">No records uploaded yet. Contact your college admin.</div>
          ) : (
            <div className="space-y-4">
              {myRecords.map((r) => (
                <div key={r.id} className="border rounded p-4 bg-white">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium">{r.student.name}</div>
                      <div className="text-sm text-gray-500">Roll: {r.student.roll}</div>
                      {r.student.program && <div className="text-xs text-gray-500">Program: {r.student.program}</div>}
                      {r.student.semester && <div className="text-xs text-gray-500">Semester: {r.student.semester}</div>}
                    </div>
                    <div className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div>
                      <div className="text-sm font-medium mb-1">Documents</div>
                      {r.documents.length === 0 ? (
                        <div className="text-xs text-gray-500">—</div>
                      ) : (
                        <ul className="space-y-1">
                          {r.documents.map((d, i) => (
                            <li key={i} className="text-sm flex items-center justify-between">
                              <span className="truncate">{d.name}</span>
                              <button
                                onClick={() => downloadBase64File(d)}
                                className="text-xs px-2 py-1 border rounded"
                              >
                                Download
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-1">Marksheets</div>
                      {r.marksheets.length === 0 ? (
                        <div className="text-xs text-gray-500">—</div>
                      ) : (
                        <ul className="space-y-1">
                          {r.marksheets.map((m, i) => (
                            <li key={i} className="text-sm flex items-center justify-between">
                              <span className="truncate">{m.name}</span>
                              <button
                                onClick={() => downloadBase64File(m)}
                                className="text-xs px-2 py-1 border rounded"
                              >
                                Download
                              </button>
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
          Note: this demo shows all uploaded records. In production, filter by authenticated student ID via backend.
        </div>
      </div>
    </div>
  );
}
