import { Award, BookOpen, Shield, GraduationCap } from "lucide-react"; // assuming you have lucide-react installed

export function TopBanner() {
  return (
    <div className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white py-6 px-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: College Logo + Name */}
        <div className="flex items-center gap-4">
          {/* Logo placeholder - replace with actual <img> tag when you have a logo */}
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
            <GraduationCap className="w-10 h-10 text-blue-700" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight">
              XYZ College of Engineering
            </h1>
            <p className="text-sm md:text-base text-blue-100">
              Empowering Futures, One Credential at a Time
            </p>
          </div>
        </div>

        {/* Right: Feature Icons */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <Shield className="w-6 h-6" />
            <span className="text-xs">Verified</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Award className="w-6 h-6" />
            <span className="text-xs">Blockchain</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <BookOpen className="w-6 h-6" />
            <span className="text-xs">Digital Records</span>
          </div>
        </div>
      </div>

      {/* Optional: Subtitle / Announcement */}
      <div className="max-w-6xl mx-auto mt-4 text-center md:text-left">
        <p className="text-sm text-blue-100">
          🎓 Securely manage and share your academic achievements on the Aptos blockchain
        </p>
      </div>
    </div>
  );
}
