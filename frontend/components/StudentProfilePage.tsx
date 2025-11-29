import React, { useEffect, useState } from "react";
import { Github, Code, Linkedin, Globe, FileText, Upload, Save, Edit2, Trash2, ExternalLink } from "lucide-react";

type SocialProfile = {
  platform: string;
  username: string;
  url: string;
  verified: boolean;
};

type Document = {
  id: string;
  name: string;
  type: "resume" | "certificate" | "project" | "other";
  dataBase64: string;
  uploadedAt: number;
  size: number;
};

type StudentProfile = {
  studentId: string;
  bio: string;
  skills: string[];
  socialProfiles: SocialProfile[];
  portfolioUrl: string;
  documents: Document[];
  achievements: string[];
  lastUpdated: number;
};

const ACCOUNT_KEY = "myapp_account";
const PROFILE_KEY_PREFIX = "student_profile_";

const PLATFORMS = [
  { id: "github", name: "GitHub", icon: Github, baseUrl: "https://github.com/" },
  { id: "hackerrank", name: "HackerRank", icon: Code, baseUrl: "https://www.hackerrank.com/" },
  { id: "leetcode", name: "LeetCode", icon: Code, baseUrl: "https://leetcode.com/" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, baseUrl: "https://www.linkedin.com/in/" },
  { id: "portfolio", name: "Portfolio", icon: Globe, baseUrl: "" },
];

async function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      res(base64);
    };
    reader.onerror = () => rej(new Error("File read error"));
    reader.readAsDataURL(file);
  });
}

export default function StudentProfilePage(): JSX.Element {
  const [account, setAccount] = useState<any | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form states
  const [bio, setBio] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [achievementInput, setAchievementInput] = useState("");
  const [achievements, setAchievements] = useState<string[]>([]);
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [socialProfiles, setSocialProfiles] = useState<SocialProfile[]>([]);
  const [newSocialPlatform, setNewSocialPlatform] = useState("");
  const [newSocialUsername, setNewSocialUsername] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    // Load account
    try {
      const raw = localStorage.getItem(ACCOUNT_KEY);
      if (raw) {
        const acc = JSON.parse(raw);
        setAccount(acc);
        
        // Load profile
        if (acc.userId || acc.address) {
          const profileKey = PROFILE_KEY_PREFIX + (acc.userId || acc.address);
          const profileRaw = localStorage.getItem(profileKey);
          if (profileRaw) {
            const prof = JSON.parse(profileRaw);
            setProfile(prof);
            loadProfileToForm(prof);
          }
        }
      }
    } catch {}

    // Listen for account changes
    const handler = (e: any) => {
      const acc = e?.detail ?? null;
      setAccount(acc);
    };
    window.addEventListener("myapp:account", handler as EventListener);
    return () => window.removeEventListener("myapp:account", handler as EventListener);
  }, []);

  function loadProfileToForm(prof: StudentProfile) {
    setBio(prof.bio || "");
    setSkills(prof.skills || []);
    setAchievements(prof.achievements || []);
    setPortfolioUrl(prof.portfolioUrl || "");
    setSocialProfiles(prof.socialProfiles || []);
    setDocuments(prof.documents || []);
  }

  function saveProfile() {
    if (!account) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const newProfile: StudentProfile = {
        studentId: account.userId || account.address,
        bio,
        skills,
        socialProfiles,
        portfolioUrl,
        documents,
        achievements,
        lastUpdated: Date.now(),
      };
      
      const profileKey = PROFILE_KEY_PREFIX + (account.userId || account.address);
      localStorage.setItem(profileKey, JSON.stringify(newProfile));
      setProfile(newProfile);
      setEditing(false);
      setMessage("Profile saved successfully!");
      
      // Broadcast profile update
      window.dispatchEvent(new CustomEvent("myapp:profile-updated", { detail: newProfile }));
    } catch (err) {
      setMessage("Failed to save profile.");
    } finally {
      setLoading(false);
    }
  }

  function addSkill() {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  }

  function removeSkill(skill: string) {
    setSkills(skills.filter((s) => s !== skill));
  }

  function addAchievement() {
    if (achievementInput.trim()) {
      setAchievements([...achievements, achievementInput.trim()]);
      setAchievementInput("");
    }
  }

  function removeAchievement(index: number) {
    setAchievements(achievements.filter((_, i) => i !== index));
  }

  function addSocialProfile() {
    if (!newSocialPlatform || !newSocialUsername.trim()) {
      setMessage("Select platform and enter username.");
      return;
    }
    
    const platform = PLATFORMS.find((p) => p.id === newSocialPlatform);
    if (!platform) return;
    
    const url = platform.baseUrl + newSocialUsername.trim();
    const newProfile: SocialProfile = {
      platform: platform.name,
      username: newSocialUsername.trim(),
      url,
      verified: false,
    };
    
    setSocialProfiles([...socialProfiles, newProfile]);
    setNewSocialPlatform("");
    setNewSocialUsername("");
    setMessage("Social profile added!");
  }

  function removeSocialProfile(index: number) {
    setSocialProfiles(socialProfiles.filter((_, i) => i !== index));
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, type: Document["type"]) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const file = files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage("File too large. Maximum 5MB allowed.");
        setLoading(false);
        return;
      }
      
      const base64 = await fileToBase64(file);
      const doc: Document = {
        id: Math.random().toString(36).slice(2, 9),
        name: file.name,
        type,
        dataBase64: base64,
        uploadedAt: Date.now(),
        size: file.size,
      };
      
      setDocuments([...documents, doc]);
      setMessage(`${file.name} uploaded successfully!`);
    } catch (err) {
      setMessage("Failed to upload file.");
    } finally {
      setLoading(false);
    }
  }

  function downloadDocument(doc: Document) {
    const byteChars = atob(doc.dataBase64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function removeDocument(id: string) {
    setDocuments(documents.filter((d) => d.id !== id));
  }

  if (!account || account.role !== "student") {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="text-center p-6 bg-yellow-50 border border-yellow-100 rounded">
          <div className="text-lg font-medium text-yellow-800">Access Denied</div>
          <div className="text-sm text-yellow-600 mt-2">This page is only accessible to students.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white border border-blue-100 rounded-lg p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-blue-700">My Profile</h2>
            <p className="text-sm text-blue-600">Build your professional profile to showcase to recruiters</p>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Edit2 className="w-4 h-4" />
            {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {/* Bio Section */}
        <div className="mb-6 border-b pb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Bio</h3>
          {editing ? (
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              rows={4}
            />
          ) : (
            <p className="text-sm text-gray-700">{bio || "No bio added yet."}</p>
          )}
        </div>

        {/* Skills Section */}
        <div className="mb-6 border-b pb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Skills</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {skills.map((skill, i) => (
              <div key={i} className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {skill}
                {editing && (
                  <button onClick={() => removeSkill(skill)} className="text-blue-600 hover:text-blue-800">
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          {editing && (
            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addSkill()}
                placeholder="Add a skill (e.g., Python, React)"
                className="flex-1 px-3 py-2 border rounded text-sm"
              />
              <button onClick={addSkill} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">
                Add
              </button>
            </div>
          )}
        </div>

        {/* Social Profiles */}
        <div className="mb-6 border-b pb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Social Profiles</h3>
          <div className="space-y-2 mb-3">
            {socialProfiles.map((prof, i) => (
              <div key={i} className="flex items-center justify-between border rounded p-3">
                <div className="flex items-center gap-3">
                  <div className="font-medium text-sm">{prof.platform}</div>
                  <a href={prof.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    {prof.username}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                {editing && (
                  <button onClick={() => removeSocialProfile(i)} className="text-red-600 hover:text-red-800">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {editing && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={newSocialPlatform}
                onChange={(e) => setNewSocialPlatform(e.target.value)}
                className="px-3 py-2 border rounded text-sm"
              >
                <option value="">Select platform</option>
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <input
                value={newSocialUsername}
                onChange={(e) => setNewSocialUsername(e.target.value)}
                placeholder="Username"
                className="px-3 py-2 border rounded text-sm"
              />
              <button onClick={addSocialProfile} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">
                Add Profile
              </button>
            </div>
          )}
        </div>

        {/* Portfolio URL */}
        <div className="mb-6 border-b pb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Portfolio Website</h3>
          {editing ? (
            <input
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://yourportfolio.com"
              className="w-full px-3 py-2 border rounded text-sm"
            />
          ) : portfolioUrl ? (
            <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {portfolioUrl}
            </a>
          ) : (
            <p className="text-sm text-gray-500">No portfolio URL added.</p>
          )}
        </div>

        {/* Documents */}
        <div className="mb-6 border-b pb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Documents</h3>
          <div className="space-y-2 mb-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between border rounded p-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-sm">{doc.name}</div>
                    <div className="text-xs text-gray-500">
                      {doc.type.toUpperCase()} • {(doc.size / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => downloadDocument(doc)} className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border rounded">
                    Download
                  </button>
                  {editing && (
                    <button onClick={() => removeDocument(doc.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {editing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Upload Resume</label>
                <input type="file" onChange={(e) => handleFileUpload(e, "resume")} className="w-full text-sm" accept=".pdf,.doc,.docx" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Upload Certificate</label>
                <input type="file" onChange={(e) => handleFileUpload(e, "certificate")} className="w-full text-sm" accept=".pdf,.jpg,.png" />
              </div>
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Achievements</h3>
          <ul className="space-y-2 mb-3">
            {achievements.map((ach, i) => (
              <li key={i} className="flex items-start justify-between border-l-4 border-blue-600 pl-3 py-2">
                <span className="text-sm text-gray-700">{ach}</span>
                {editing && (
                  <button onClick={() => removeAchievement(i)} className="text-red-600 hover:text-red-800">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {editing && (
            <div className="flex gap-2">
              <input
                value={achievementInput}
                onChange={(e) => setAchievementInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addAchievement()}
                placeholder="Describe an achievement..."
                className="flex-1 px-3 py-2 border rounded text-sm"
              />
              <button onClick={addAchievement} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">
                Add
              </button>
            </div>
          )}
        </div>

        {/* Save Button */}
        {editing && (
          <div className="flex justify-end gap-3">
            <button onClick={() => setEditing(false)} className="px-4 py-2 bg-white border rounded">
              Cancel
            </button>
            <button onClick={saveProfile} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : "Save Profile"}
            </button>
          </div>
        )}

        {message && <div className="mt-4 text-center text-sm text-gray-700">{message}</div>}

        <div className="mt-6 text-xs text-gray-500">
          💡 Tip: Keep your profile updated to stand out when colleges or recruiters view your credentials!
        </div>
      </div>
    </div>
  );
}
